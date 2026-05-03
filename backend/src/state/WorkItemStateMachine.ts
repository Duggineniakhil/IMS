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
 * Base abstract class for WorkItem State Pattern.
 */
export abstract class BaseWorkItemState {
  protected context: any; // Prisma WorkItem with RCA

  constructor(context: any) {
    this.context = context;
  }

  abstract transition(newStatus: Status): Promise<void>;

  protected async updateStatus(newStatus: Status): Promise<void> {
    await prisma.workItem.update({
      where: { id: this.context.id },
      data: { status: newStatus },
    });
    await WorkItemStateMachine.invalidateCache();
    console.log(`✅ [STATE MACHINE] WorkItem ${this.context.id}: ${this.context.status} → ${newStatus}`);
  }
}

class OpenState extends BaseWorkItemState {
  async transition(newStatus: Status): Promise<void> {
    if (newStatus !== 'INVESTIGATING') {
      throw new InvalidTransitionError(this.context.status, newStatus);
    }
    await this.updateStatus(newStatus);
  }
}

class InvestigatingState extends BaseWorkItemState {
  async transition(newStatus: Status): Promise<void> {
    if (newStatus !== 'RESOLVED') {
      throw new InvalidTransitionError(this.context.status, newStatus);
    }
    await this.updateStatus(newStatus);
  }
}

class ResolvedState extends BaseWorkItemState {
  async transition(newStatus: Status): Promise<void> {
    if (newStatus !== 'CLOSED') {
      throw new InvalidTransitionError(this.context.status, newStatus);
    }

    const { rca } = this.context;
    if (!rca) throw new IncompleteRCAError('Cannot close WorkItem: RCA is missing');
    if (!rca.fixApplied || rca.fixApplied.trim().length === 0) throw new IncompleteRCAError('Cannot close WorkItem: fixApplied is empty');
    if (!rca.preventionSteps || rca.preventionSteps.trim().length === 0) throw new IncompleteRCAError('Cannot close WorkItem: preventionSteps is empty');
    if (!rca.endTime) throw new IncompleteRCAError('Cannot close WorkItem: endTime is missing');
    if (!rca.rootCauseCategory || rca.rootCauseCategory.trim().length === 0) throw new IncompleteRCAError('Cannot close WorkItem: rootCauseCategory is empty');

    await this.updateStatus(newStatus);
  }
}

class ClosedState extends BaseWorkItemState {
  async transition(newStatus: Status): Promise<void> {
    throw new InvalidTransitionError(this.context.status, newStatus); // CLOSED is terminal
  }
}

export class WorkItemStateMachine {
  static getStateObject(context: any): BaseWorkItemState {
    switch (context.status) {
      case 'OPEN': return new OpenState(context);
      case 'INVESTIGATING': return new InvestigatingState(context);
      case 'RESOLVED': return new ResolvedState(context);
      case 'CLOSED': return new ClosedState(context);
      default: throw new Error('Unknown state');
    }
  }

  static async transition(workItemId: string, newStatus: Status): Promise<void> {
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      include: { rca: true },
    });

    if (!workItem) {
      throw new Error(`WorkItem ${workItemId} not found`);
    }

    const stateObj = this.getStateObject(workItem);
    await stateObj.transition(newStatus);
  }

  static getValidTransitions(currentStatus: Status): Status[] {
    const map: Record<Status, Status[]> = {
      OPEN: ['INVESTIGATING'],
      INVESTIGATING: ['RESOLVED'],
      RESOLVED: ['CLOSED'],
      CLOSED: [],
    };
    return map[currentStatus] || [];
  }

  static async invalidateCache(): Promise<void> {
    try {
      const keys = await redis.keys('dashboard:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      await redis.del('workitems:list');
      // PubSub event for dashboard real-time updates
      await redis.publish('dashboard-updates', 'refresh');
    } catch (error) {
      console.error('[CACHE] Failed to invalidate cache:', error);
    }
  }
}
