import { Priority } from '@prisma/client';

/**
 * Strategy interface for alerting based on component type.
 * Each strategy determines the priority level and notification channels.
 */
export interface AlertStrategy {
  /** Returns the priority level for this type of failure */
  getPriority(): Priority;
  /** Returns the list of notification channels to use */
  getNotificationChannels(): string[];
  /** Executes the alert (simulated via console logging) */
  execute(workItem: { id: string; componentId: string; status: string }): Promise<void>;
}

/**
 * P0 alert strategy for RDBMS failures.
 * Database failures are critical - pages PagerDuty + Slack.
 */
export class RDBMSFailureStrategy implements AlertStrategy {
  getPriority(): Priority {
    return 'P0';
  }

  getNotificationChannels(): string[] {
    return ['PagerDuty', 'Slack', 'Email'];
  }

  async execute(workItem: { id: string; componentId: string; status: string }): Promise<void> {
    const channels = this.getNotificationChannels().join(', ');
    console.log(
      `🚨 [P0 ALERT] RDBMS Failure | WorkItem: ${workItem.id} | Component: ${workItem.componentId} | Channels: ${channels}`
    );
  }
}

/**
 * P2 alert strategy for cache failures.
 * Cache failures are degraded performance - Slack only.
 */
export class CacheFailureStrategy implements AlertStrategy {
  getPriority(): Priority {
    return 'P2';
  }

  getNotificationChannels(): string[] {
    return ['Slack'];
  }

  async execute(workItem: { id: string; componentId: string; status: string }): Promise<void> {
    const channels = this.getNotificationChannels().join(', ');
    console.log(
      `⚠️  [P2 ALERT] Cache Failure | WorkItem: ${workItem.id} | Component: ${workItem.componentId} | Channels: ${channels}`
    );
  }
}

/**
 * P1 alert strategy for API failures.
 * API failures affect users - Slack notification.
 */
export class APIFailureStrategy implements AlertStrategy {
  getPriority(): Priority {
    return 'P1';
  }

  getNotificationChannels(): string[] {
    return ['Slack', 'Email'];
  }

  async execute(workItem: { id: string; componentId: string; status: string }): Promise<void> {
    const channels = this.getNotificationChannels().join(', ');
    console.log(
      `🔶 [P1 ALERT] API Failure | WorkItem: ${workItem.id} | Component: ${workItem.componentId} | Channels: ${channels}`
    );
  }
}

/**
 * P1 alert strategy for queue failures.
 * Queue failures can cause data loss - Slack notification.
 */
export class QueueFailureStrategy implements AlertStrategy {
  getPriority(): Priority {
    return 'P1';
  }

  getNotificationChannels(): string[] {
    return ['Slack'];
  }

  async execute(workItem: { id: string; componentId: string; status: string }): Promise<void> {
    const channels = this.getNotificationChannels().join(', ');
    console.log(
      `🔶 [P1 ALERT] Queue Failure | WorkItem: ${workItem.id} | Component: ${workItem.componentId} | Channels: ${channels}`
    );
  }
}

/**
 * P2 alert strategy for NoSQL failures.
 */
export class NoSQLFailureStrategy implements AlertStrategy {
  getPriority(): Priority {
    return 'P2';
  }

  getNotificationChannels(): string[] {
    return ['Slack'];
  }

  async execute(workItem: { id: string; componentId: string; status: string }): Promise<void> {
    const channels = this.getNotificationChannels().join(', ');
    console.log(
      `⚠️  [P2 ALERT] NoSQL Failure | WorkItem: ${workItem.id} | Component: ${workItem.componentId} | Channels: ${channels}`
    );
  }
}

/**
 * P3 alert strategy for MCP (Monitoring Control Plane) failures.
 */
export class MCPFailureStrategy implements AlertStrategy {
  getPriority(): Priority {
    return 'P3';
  }

  getNotificationChannels(): string[] {
    return ['Slack'];
  }

  async execute(workItem: { id: string; componentId: string; status: string }): Promise<void> {
    const channels = this.getNotificationChannels().join(', ');
    console.log(
      `ℹ️  [P3 ALERT] MCP Failure | WorkItem: ${workItem.id} | Component: ${workItem.componentId} | Channels: ${channels}`
    );
  }
}

/**
 * Factory for creating the appropriate AlertStrategy based on component type.
 * Uses the Strategy design pattern to decouple alert logic from signal processing.
 */
export class AlertStrategyFactory {
  /** Creates and returns the appropriate AlertStrategy for the given componentType */
  static create(componentType: string): AlertStrategy {
    switch (componentType) {
      case 'RDBMS':
        return new RDBMSFailureStrategy();
      case 'CACHE':
        return new CacheFailureStrategy();
      case 'API':
        return new APIFailureStrategy();
      case 'QUEUE':
        return new QueueFailureStrategy();
      case 'NOSQL':
        return new NoSQLFailureStrategy();
      case 'MCP':
        return new MCPFailureStrategy();
      default:
        console.warn(`Unknown component type: ${componentType}, defaulting to P3`);
        return new MCPFailureStrategy();
    }
  }
}
