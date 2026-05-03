import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Status } from '@prisma/client';

// Mock Prisma
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock('../config/database', () => ({
  prisma: {
    workItem: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

// Mock Redis
const mockDel = vi.fn();
const mockKeys = vi.fn().mockResolvedValue([]);
vi.mock('../config/redis', () => ({
  redis: {
    del: (...args: any[]) => mockDel(...args),
    keys: (...args: any[]) => mockKeys(...args),
  },
}));

import {
  WorkItemStateMachine,
  InvalidTransitionError,
  IncompleteRCAError,
} from '../state/WorkItemStateMachine';

describe('WorkItemStateMachine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockKeys.mockResolvedValue([]);
  });

  describe('Valid transitions', () => {
    it('should allow OPEN → INVESTIGATING', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-1',
        status: 'OPEN' as Status,
        rca: null,
      });

      await expect(
        WorkItemStateMachine.transition('test-1', 'INVESTIGATING')
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'test-1' },
        data: { status: 'INVESTIGATING' },
      });
    });

    it('should allow INVESTIGATING → RESOLVED', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-2',
        status: 'INVESTIGATING' as Status,
        rca: null,
      });

      await expect(
        WorkItemStateMachine.transition('test-2', 'RESOLVED')
      ).resolves.toBeUndefined();
    });

    it('should allow RESOLVED → CLOSED with complete RCA', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-3',
        status: 'RESOLVED' as Status,
        rca: {
          fixApplied: 'Fixed the connection pooling issue by increasing max connections',
          preventionSteps: 'Added circuit breaker and connection pool monitoring',
          endTime: new Date(),
          rootCauseCategory: 'Infrastructure',
        },
      });

      await expect(
        WorkItemStateMachine.transition('test-3', 'CLOSED')
      ).resolves.toBeUndefined();
    });

    it('should allow full valid lifecycle: OPEN → INVESTIGATING → RESOLVED → CLOSED', async () => {
      // OPEN → INVESTIGATING
      mockFindUnique.mockResolvedValue({ id: 'test-lc', status: 'OPEN', rca: null });
      await WorkItemStateMachine.transition('test-lc', 'INVESTIGATING');

      // INVESTIGATING → RESOLVED
      mockFindUnique.mockResolvedValue({ id: 'test-lc', status: 'INVESTIGATING', rca: null });
      await WorkItemStateMachine.transition('test-lc', 'RESOLVED');

      // RESOLVED → CLOSED
      mockFindUnique.mockResolvedValue({
        id: 'test-lc',
        status: 'RESOLVED',
        rca: {
          fixApplied: 'Applied database connection fix',
          preventionSteps: 'Added monitoring and alerts',
          endTime: new Date(),
          rootCauseCategory: 'Infrastructure',
        },
      });
      await WorkItemStateMachine.transition('test-lc', 'CLOSED');

      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('Invalid transitions', () => {
    it('should REJECT OPEN → RESOLVED (invalid skip)', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-skip-1',
        status: 'OPEN' as Status,
        rca: null,
      });

      await expect(
        WorkItemStateMachine.transition('test-skip-1', 'RESOLVED')
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('should REJECT OPEN → CLOSED (invalid skip)', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-skip-2',
        status: 'OPEN' as Status,
        rca: null,
      });

      await expect(
        WorkItemStateMachine.transition('test-skip-2', 'CLOSED')
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('should REJECT INVESTIGATING → OPEN (reverse transition)', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-rev',
        status: 'INVESTIGATING' as Status,
        rca: null,
      });

      await expect(
        WorkItemStateMachine.transition('test-rev', 'OPEN')
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('should REJECT CLOSED → any state (terminal state)', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-term',
        status: 'CLOSED' as Status,
        rca: {
          fixApplied: 'Done',
          preventionSteps: 'Done',
          endTime: new Date(),
          rootCauseCategory: 'Infrastructure',
        },
      });

      await expect(
        WorkItemStateMachine.transition('test-term', 'OPEN')
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe('RCA validation for CLOSED transition', () => {
    it('should REJECT transition to CLOSED with missing RCA', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-no-rca',
        status: 'RESOLVED' as Status,
        rca: null,
      });

      await expect(
        WorkItemStateMachine.transition('test-no-rca', 'CLOSED')
      ).rejects.toThrow(IncompleteRCAError);
    });

    it('should REJECT transition to CLOSED with empty fixApplied', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-empty-fix',
        status: 'RESOLVED' as Status,
        rca: {
          fixApplied: '',
          preventionSteps: 'Valid prevention steps',
          endTime: new Date(),
          rootCauseCategory: 'Infrastructure',
        },
      });

      await expect(
        WorkItemStateMachine.transition('test-empty-fix', 'CLOSED')
      ).rejects.toThrow(IncompleteRCAError);
    });

    it('should REJECT transition to CLOSED with missing endTime', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-no-end',
        status: 'RESOLVED' as Status,
        rca: {
          fixApplied: 'Fixed the issue properly',
          preventionSteps: 'Added monitoring',
          endTime: null,
          rootCauseCategory: 'Infrastructure',
        },
      });

      await expect(
        WorkItemStateMachine.transition('test-no-end', 'CLOSED')
      ).rejects.toThrow(IncompleteRCAError);
    });

    it('should REJECT transition to CLOSED with empty rootCauseCategory', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-no-rcc',
        status: 'RESOLVED' as Status,
        rca: {
          fixApplied: 'Fixed the issue properly',
          preventionSteps: 'Added monitoring',
          endTime: new Date(),
          rootCauseCategory: '',
        },
      });

      await expect(
        WorkItemStateMachine.transition('test-no-rcc', 'CLOSED')
      ).rejects.toThrow(IncompleteRCAError);
    });
  });

  describe('getValidTransitions', () => {
    it('should return [INVESTIGATING] for OPEN status', () => {
      expect(WorkItemStateMachine.getValidTransitions('OPEN')).toEqual(['INVESTIGATING']);
    });

    it('should return [RESOLVED] for INVESTIGATING status', () => {
      expect(WorkItemStateMachine.getValidTransitions('INVESTIGATING')).toEqual(['RESOLVED']);
    });

    it('should return [CLOSED] for RESOLVED status', () => {
      expect(WorkItemStateMachine.getValidTransitions('RESOLVED')).toEqual(['CLOSED']);
    });

    it('should return empty array for CLOSED status', () => {
      expect(WorkItemStateMachine.getValidTransitions('CLOSED')).toEqual([]);
    });
  });

  describe('WorkItem not found', () => {
    it('should throw if WorkItem does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        WorkItemStateMachine.transition('non-existent', 'INVESTIGATING')
      ).rejects.toThrow('WorkItem non-existent not found');
    });
  });
});
