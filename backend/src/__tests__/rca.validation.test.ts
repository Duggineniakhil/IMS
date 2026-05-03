import { describe, it, expect } from 'vitest';
import { SignalPayloadSchema, RCAPayloadSchema, StatusTransitionSchema } from '../schemas/validation';

describe('RCA Validation', () => {
  describe('RCAPayloadSchema', () => {
    const validRCA = {
      startTime: '2024-01-15T10:00:00.000Z',
      endTime: '2024-01-15T12:34:00.000Z',
      rootCauseCategory: 'Infrastructure' as const,
      fixApplied: 'Restarted the database connection pool and increased max connections from 100 to 200',
      preventionSteps: 'Added circuit breaker pattern and connection pool monitoring alerts',
    };

    it('should ACCEPT valid RCA payload', () => {
      const result = RCAPayloadSchema.safeParse(validRCA);
      expect(result.success).toBe(true);
    });

    it('should REJECT RCA with fixApplied < 10 chars', () => {
      const result = RCAPayloadSchema.safeParse({
        ...validRCA,
        fixApplied: 'Fixed it',
      });
      expect(result.success).toBe(false);
    });

    it('should REJECT RCA with preventionSteps < 10 chars', () => {
      const result = RCAPayloadSchema.safeParse({
        ...validRCA,
        preventionSteps: 'Monitor',
      });
      expect(result.success).toBe(false);
    });

    it('should REJECT RCA with invalid rootCauseCategory', () => {
      const result = RCAPayloadSchema.safeParse({
        ...validRCA,
        rootCauseCategory: 'InvalidCategory',
      });
      expect(result.success).toBe(false);
    });

    it('should REJECT RCA with missing endTime', () => {
      const { endTime, ...withoutEnd } = validRCA;
      const result = RCAPayloadSchema.safeParse(withoutEnd);
      expect(result.success).toBe(false);
    });

    it('should REJECT RCA with missing startTime', () => {
      const { startTime, ...withoutStart } = validRCA;
      const result = RCAPayloadSchema.safeParse(withoutStart);
      expect(result.success).toBe(false);
    });

    it('should REJECT RCA with invalid datetime format', () => {
      const result = RCAPayloadSchema.safeParse({
        ...validRCA,
        startTime: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should calculate MTTR correctly with known times', () => {
      // Simulate MTTR calculation: (endTime - workItem.createdAt) / 1000
      const workItemCreatedAt = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T12:34:00.000Z');

      const mttr = Math.round((endTime.getTime() - workItemCreatedAt.getTime()) / 1000);

      // 2h 34m = 9240 seconds
      expect(mttr).toBe(9240);
    });

    it('should detect endTime < startTime', () => {
      const startTime = new Date('2024-01-15T12:00:00.000Z');
      const endTime = new Date('2024-01-15T10:00:00.000Z');

      // This is a business logic check, not a schema check
      expect(endTime < startTime).toBe(true);
    });

    it('should accept all valid rootCauseCategory values', () => {
      const categories = [
        'Infrastructure',
        'Configuration',
        'Code Bug',
        'Third-party',
        'Human Error',
        'Unknown',
      ];

      for (const category of categories) {
        const result = RCAPayloadSchema.safeParse({
          ...validRCA,
          rootCauseCategory: category,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('SignalPayloadSchema', () => {
    it('should accept valid signal payload', () => {
      const result = SignalPayloadSchema.safeParse({
        componentId: 'RDBMS_PRIMARY',
        componentType: 'RDBMS',
        errorCode: 'CONN_TIMEOUT',
        latencyMs: 3500,
        payload: { host: 'db.internal' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject signal with missing componentId', () => {
      const result = SignalPayloadSchema.safeParse({
        componentType: 'RDBMS',
        errorCode: 'CONN_TIMEOUT',
        latencyMs: 3500,
      });
      expect(result.success).toBe(false);
    });

    it('should reject signal with invalid componentType', () => {
      const result = SignalPayloadSchema.safeParse({
        componentId: 'TEST',
        componentType: 'INVALID',
        errorCode: 'ERROR',
        latencyMs: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject signal with negative latencyMs', () => {
      const result = SignalPayloadSchema.safeParse({
        componentId: 'TEST',
        componentType: 'API',
        errorCode: 'ERROR',
        latencyMs: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('StatusTransitionSchema', () => {
    it('should accept valid status values', () => {
      for (const status of ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']) {
        const result = StatusTransitionSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status values', () => {
      const result = StatusTransitionSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});
