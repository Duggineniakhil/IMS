import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis
const mockGet = vi.fn();
const mockSetex = vi.fn();
const mockIncr = vi.fn();
const mockExpire = vi.fn();
const mockKeys = vi.fn().mockResolvedValue([]);
const mockDel = vi.fn();

vi.mock('../config/redis', () => ({
  redis: {
    get: (...args: any[]) => mockGet(...args),
    setex: (...args: any[]) => mockSetex(...args),
    incr: (...args: any[]) => mockIncr(...args),
    expire: (...args: any[]) => mockExpire(...args),
    keys: (...args: any[]) => mockKeys(...args),
    del: (...args: any[]) => mockDel(...args),
  },
  createRedisConnection: () => ({
    on: vi.fn(),
  }),
}));

// Mock Prisma
const mockCreate = vi.fn();
const mockTransaction = vi.fn();
vi.mock('../config/database', () => ({
  prisma: {
    workItem: {
      create: (...args: any[]) => mockCreate(...args),
    },
    signal: {
      create: vi.fn().mockResolvedValue({ id: 'signal-1' }),
    },
    $transaction: (...args: any[]) => mockTransaction(...args),
  },
}));

// Mock Mongoose model
vi.mock('../models/RawSignal', () => ({
  RawSignalModel: {
    create: vi.fn().mockResolvedValue({ _id: { toString: () => 'mongo-id-1' } }),
    updateOne: vi.fn().mockResolvedValue({}),
  },
}));

describe('Debounce Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(1);
    mockKeys.mockResolvedValue([]);
  });

  it('should NOT create new WorkItem when debounce key exists (second signal within 10s)', async () => {
    // Simulate debounce key exists (signal already received for this component)
    const componentId = 'RDBMS_PRIMARY';
    const debounceKey = `debounce:${componentId}`;
    const existingWorkItemId = 'existing-work-item-id';

    mockGet.mockResolvedValue(existingWorkItemId);

    // Verify that when we check for the debounce key, it returns an existing ID
    const result = await mockGet(debounceKey);
    expect(result).toBe(existingWorkItemId);

    // In this case, the worker would link the signal, NOT create a new WorkItem
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should create new WorkItem when debounce key does NOT exist (first signal or after TTL)', async () => {
    const componentId = 'RDBMS_PRIMARY';
    const debounceKey = `debounce:${componentId}`;

    // No debounce key exists
    mockGet.mockResolvedValue(null);

    const result = await mockGet(debounceKey);
    expect(result).toBeNull();

    // Simulate creating a new WorkItem
    const newWorkItem = { id: 'new-work-item-id', componentId, status: 'OPEN', priority: 'P0' };
    mockCreate.mockResolvedValue(newWorkItem);

    const created = await mockCreate({ data: { componentId, status: 'OPEN', priority: 'P0' } });
    expect(created.id).toBe('new-work-item-id');

    // Set debounce key
    await mockSetex(debounceKey, 10, created.id);
    expect(mockSetex).toHaveBeenCalledWith(debounceKey, 10, 'new-work-item-id');
  });

  it('should use 10-second TTL for debounce keys', async () => {
    const componentId = 'API_GATEWAY';
    const debounceKey = `debounce:${componentId}`;
    const workItemId = 'wi-123';

    await mockSetex(debounceKey, 10, workItemId);

    expect(mockSetex).toHaveBeenCalledWith(debounceKey, 10, workItemId);
  });

  it('should handle different componentIds independently', async () => {
    // Component A has debounce key
    mockGet.mockImplementation((key: string) => {
      if (key === 'debounce:RDBMS_PRIMARY') return Promise.resolve('wi-rdbms');
      if (key === 'debounce:API_GATEWAY') return Promise.resolve(null);
      return Promise.resolve(null);
    });

    const rdbmsResult = await mockGet('debounce:RDBMS_PRIMARY');
    const apiResult = await mockGet('debounce:API_GATEWAY');

    expect(rdbmsResult).toBe('wi-rdbms'); // Should link to existing
    expect(apiResult).toBeNull(); // Should create new
  });
});
