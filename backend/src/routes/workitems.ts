import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { RawSignalModel } from '../models/RawSignal';
import { WorkItemStateMachine, InvalidTransitionError, IncompleteRCAError } from '../state/WorkItemStateMachine';
import {
  StatusTransitionSchema,
  RCAPayloadSchema,
} from '../schemas/validation';
import { Status, Priority } from '@prisma/client';
import { ZodError } from 'zod';

const CACHE_TTL = 10; // seconds

/**
 * WorkItem API routes.
 * Provides CRUD operations, status transitions, and RCA management.
 */
export async function workItemRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/workitems
   * Returns a paginated list of work items, filterable by status and priority.
   * Results are cached in Redis for hot-path dashboard reads.
   */
  fastify.get(
    '/api/workitems',
    async (
      request: FastifyRequest<{
        Querystring: {
          page?: string;
          limit?: string;
          status?: Status;
          priority?: Priority;
        };
      }>,
      reply: FastifyReply
    ) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
      const skip = (page - 1) * limit;
      const { status, priority } = request.query;

      // Build cache key
      const cacheKey = `workitems:list:${page}:${limit}:${status || 'all'}:${priority || 'all'}`;

      // Try cache first
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return reply.send(JSON.parse(cached));
        }
      } catch (e) {
        // Cache miss, proceed to DB
      }

      const where: any = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const [workItems, total] = await Promise.all([
        prisma.workItem.findMany({
          where,
          include: {
            rca: true,
            _count: { select: { signals: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.workItem.count({ where }),
      ]);

      const result = {
        data: workItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache result
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      } catch (e) {
        // Non-critical
      }

      return reply.send(result);
    }
  );

  /**
   * GET /api/workitems/:id
   * Returns a single work item with its linked signals from MongoDB.
   */
  fastify.get(
    '/api/workitems/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const workItem = await prisma.workItem.findUnique({
        where: { id },
        include: {
          rca: true,
          signals: true,
        },
      });

      if (!workItem) {
        return reply.status(404).send({ error: 'WorkItem not found' });
      }

      // Fetch raw signals from MongoDB
      const mongoSignalIds = workItem.signals.map((s) => s.mongoSignalId);
      let rawSignals: any[] = [];
      try {
        rawSignals = await RawSignalModel.find({
          _id: { $in: mongoSignalIds },
        }).sort({ receivedAt: -1 }).lean();
      } catch (e) {
        // MongoDB might be unavailable
      }

      return reply.send({
        ...workItem,
        rawSignals,
      });
    }
  );

  /**
   * PUT /api/workitems/:id/status
   * Transitions a work item to a new status using the state machine.
   * Validates transitions and RCA completeness.
   */
  fastify.put(
    '/api/workitems/:id/status',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { status: Status };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { status } = StatusTransitionSchema.parse(request.body);

        await WorkItemStateMachine.transition(id, status);

        const updated = await prisma.workItem.findUnique({
          where: { id },
          include: { rca: true },
        });

        return reply.send({
          status: 'success',
          data: updated,
        });
      } catch (error) {
        if (error instanceof InvalidTransitionError) {
          return reply.status(400).send({
            status: 'error',
            message: error.message,
          });
        }
        if (error instanceof IncompleteRCAError) {
          return reply.status(400).send({
            status: 'error',
            message: error.message,
          });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send({
            status: 'error',
            message: 'Validation failed',
            errors: error.errors,
          });
        }
        throw error;
      }
    }
  );

  /**
   * POST /api/workitems/:id/rca
   * Creates or updates the Root Cause Analysis for a work item.
   * Automatically calculates MTTR from the work item creation time.
   */
  fastify.post(
    '/api/workitems/:id/rca',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          startTime: string;
          endTime: string;
          rootCauseCategory: string;
          fixApplied: string;
          preventionSteps: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const payload = RCAPayloadSchema.parse(request.body);

        const workItem = await prisma.workItem.findUnique({ where: { id } });
        if (!workItem) {
          return reply.status(404).send({ error: 'WorkItem not found' });
        }

        const startTime = new Date(payload.startTime);
        const endTime = new Date(payload.endTime);

        if (endTime < startTime) {
          return reply.status(400).send({
            status: 'error',
            message: 'endTime must be after startTime',
          });
        }

        // Calculate MTTR: seconds between workItem creation and endTime
        const mttr = Math.round((endTime.getTime() - workItem.createdAt.getTime()) / 1000);

        const rca = await prisma.rCA.upsert({
          where: { workItemId: id },
          update: {
            startTime,
            endTime,
            rootCauseCategory: payload.rootCauseCategory,
            fixApplied: payload.fixApplied,
            preventionSteps: payload.preventionSteps,
            mttr,
          },
          create: {
            workItemId: id,
            startTime,
            endTime,
            rootCauseCategory: payload.rootCauseCategory,
            fixApplied: payload.fixApplied,
            preventionSteps: payload.preventionSteps,
            mttr,
          },
        });

        // Invalidate cache
        try {
          const keys = await redis.keys('dashboard:*');
          if (keys.length > 0) await redis.del(...keys);
          await redis.del('workitems:list');
        } catch (e) {}

        return reply.send({
          status: 'success',
          data: rca,
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            status: 'error',
            message: 'Validation failed',
            errors: error.errors,
          });
        }
        throw error;
      }
    }
  );
}
