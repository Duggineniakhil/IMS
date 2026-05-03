import { Status } from '@prisma/client';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

/**
 * Custom error thrown when attempting to close a WorkItem without a complete RCA.
 */
export class IncompleteRCAError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IncompleteRCAError';
  }
}

/**
 * Custom error thrown when attempting an invalid state transition.
 */
export class InvalidTransitionError extends Error {
  constructor(from: Status, to: Status) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Valid state transition map for WorkItem lifecycle.
 * Enforces: OPEN → INVESTIGATING → RESOLVED → CLOSED
 */
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

/**
 * State Machine for managing WorkItem lifecycle transitions.
 * Enforces valid transitions and validates RCA completeness before CLOSED state.
 */
export class WorkItemStateMachine {
  /**
   * Transitions a WorkItem to a new status.
   * @param workItemId - The ID of the WorkItem to transition
   * @param newStatus - The target status
   * @throws InvalidTransitionError if the transition is not allowed
   * @throws IncompleteRCAError if transitioning to CLOSED without complete RCA
   */
  static async transition(workItemId: string, newStatus: Status): Promise<void> {
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      include: { rca: true },
    });

    if (!workItem) {
      throw new Error(`WorkItem ${workItemId} not found`);
    }

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[workItem.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new InvalidTransitionError(workItem.status, newStatus);
    }

    // Validate RCA completeness for CLOSED transition
    if (newStatus === 'CLOSED') {
      if (!workItem.rca) {
        throw new IncompleteRCAError('Cannot close WorkItem: RCA is missing');
      }
      if (!workItem.rca.fixApplied || workItem.rca.fixApplied.trim().length === 0) {
        throw new IncompleteRCAError('Cannot close WorkItem: fixApplied is empty');
      }
      if (!workItem.rca.preventionSteps || workItem.rca.preventionSteps.trim().length === 0) {
        throw new IncompleteRCAError('Cannot close WorkItem: preventionSteps is empty');
      }
      if (!workItem.rca.endTime) {
        throw new IncompleteRCAError('Cannot close WorkItem: endTime is missing');
      }
      if (!workItem.rca.rootCauseCategory || workItem.rca.rootCauseCategory.trim().length === 0) {
        throw new IncompleteRCAError('Cannot close WorkItem: rootCauseCategory is empty');
      }
    }

    // Update status in database
    await prisma.workItem.update({
      where: { id: workItemId },
      data: { status: newStatus },
    });

    // Invalidate Redis dashboard cache
    await WorkItemStateMachine.invalidateCache();

    console.log(`✅ [STATE MACHINE] WorkItem ${workItemId}: ${workItem.status} → ${newStatus}`);
  }

  /**
   * Returns the valid next states for a given status.
   */
  static getValidTransitions(currentStatus: Status): Status[] {
    return VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Invalidates all cached dashboard data in Redis.
   */
  static async invalidateCache(): Promise<void> {
    try {
      const keys = await redis.keys('dashboard:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      await redis.del('workitems:list');
    } catch (error) {
      console.error('[CACHE] Failed to invalidate cache:', error);
    }
  }
}
