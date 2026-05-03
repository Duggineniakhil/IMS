import { Priority } from '@prisma/client';

/**
 * Strategy pattern interface for determining incident priority.
 * Different component failures require different alert types/priorities.
 */
export interface AlertingStrategy {
  getPriority(signal: { componentType: string; errorCode: string }): Priority;
}

/**
 * Standard alerting strategy based on component criticality.
 */
export class MissionCriticalAlertingStrategy implements AlertingStrategy {
  getPriority(signal: { componentType: string; errorCode: string }): Priority {
    // Critical Infrastructure
    if (signal.componentType === 'RDBMS' || signal.componentType === 'MCP') {
      return 'P0';
    }

    // High Impact
    if (signal.componentType === 'API' || signal.componentType === 'NOSQL') {
      if (signal.errorCode === 'TIMEOUT') return 'P0';
      return 'P1';
    }

    // Medium/Low Impact
    if (signal.componentType === 'CACHE' || signal.componentType === 'QUEUE') {
      return 'P2';
    }

    return 'P3';
  }
}

/**
 * Alternative strategy for maintenance or low-prio windows (if needed).
 */
export class LowPriorityAlertingStrategy implements AlertingStrategy {
  getPriority(): Priority {
    return 'P3';
  }
}
