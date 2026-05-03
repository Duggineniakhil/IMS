import { describe, it, expect } from 'vitest';
import { AlertStrategyFactory, RDBMSFailureStrategy, CacheFailureStrategy, APIFailureStrategy, QueueFailureStrategy } from '../strategies/AlertStrategy';

describe('AlertStrategy', () => {
  describe('AlertStrategyFactory', () => {
    it('should return RDBMSFailureStrategy for RDBMS component type', () => {
      const strategy = AlertStrategyFactory.create('RDBMS');
      expect(strategy).toBeInstanceOf(RDBMSFailureStrategy);
      expect(strategy.getPriority()).toBe('P0');
    });

    it('should return CacheFailureStrategy for CACHE component type', () => {
      const strategy = AlertStrategyFactory.create('CACHE');
      expect(strategy).toBeInstanceOf(CacheFailureStrategy);
      expect(strategy.getPriority()).toBe('P2');
    });

    it('should return APIFailureStrategy for API component type', () => {
      const strategy = AlertStrategyFactory.create('API');
      expect(strategy).toBeInstanceOf(APIFailureStrategy);
      expect(strategy.getPriority()).toBe('P1');
    });

    it('should return QueueFailureStrategy for QUEUE component type', () => {
      const strategy = AlertStrategyFactory.create('QUEUE');
      expect(strategy).toBeInstanceOf(QueueFailureStrategy);
      expect(strategy.getPriority()).toBe('P1');
    });

    it('should default to P3 for unknown component types', () => {
      const strategy = AlertStrategyFactory.create('UNKNOWN_TYPE');
      expect(strategy.getPriority()).toBe('P3');
    });
  });

  describe('RDBMSFailureStrategy', () => {
    it('should have P0 priority', () => {
      const strategy = new RDBMSFailureStrategy();
      expect(strategy.getPriority()).toBe('P0');
    });

    it('should include PagerDuty in notification channels', () => {
      const strategy = new RDBMSFailureStrategy();
      expect(strategy.getNotificationChannels()).toContain('PagerDuty');
      expect(strategy.getNotificationChannels()).toContain('Slack');
    });

    it('should execute without throwing', async () => {
      const strategy = new RDBMSFailureStrategy();
      await expect(
        strategy.execute({ id: 'test-id', componentId: 'RDBMS_PRIMARY', status: 'OPEN' })
      ).resolves.toBeUndefined();
    });
  });

  describe('CacheFailureStrategy', () => {
    it('should have P2 priority', () => {
      const strategy = new CacheFailureStrategy();
      expect(strategy.getPriority()).toBe('P2');
    });

    it('should only notify via Slack', () => {
      const strategy = new CacheFailureStrategy();
      expect(strategy.getNotificationChannels()).toEqual(['Slack']);
    });
  });

  describe('APIFailureStrategy', () => {
    it('should have P1 priority', () => {
      const strategy = new APIFailureStrategy();
      expect(strategy.getPriority()).toBe('P1');
    });

    it('should notify via Slack and Email', () => {
      const strategy = new APIFailureStrategy();
      const channels = strategy.getNotificationChannels();
      expect(channels).toContain('Slack');
      expect(channels).toContain('Email');
    });
  });
});
