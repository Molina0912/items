import { describe, test, expect } from 'bun:test';
import { ChannelRouter, SenderValidator } from '@expo/channels';
import type { ChannelRoute, ChannelAllowlist, ChannelMessage } from '@expo/channels';

const allowlist: ChannelAllowlist = {
  channels: ['push-main', 'email-admin', 'webhook-ci'],
  senders: ['agent-1', 'system', 'user-a'],
  events: ['build.complete', 'permission.request'],
};

const routes: ChannelRoute[] = [
  { event: 'build.complete', channels: ['push-main', 'webhook-ci'] },
  { event: 'permission.request', channels: ['email-admin'] },
  { event: 'error.critical', channels: ['push-main', 'email-admin'] },
];

describe('ChannelRouter', () => {
  test('routes event to matching channels', () => {
    const router = new ChannelRouter(routes, allowlist);
    const targets = router.route('build.complete', { channel: 'push-main', body: 'done' });
    expect(targets).toContain('push-main');
    expect(targets).toContain('webhook-ci');
  });

  test('routes event only to allowed channels', () => {
    const router = new ChannelRouter(routes, allowlist);
    const targets = router.route('error.critical', { channel: 'push-main', body: 'error' });
    expect(targets).toContain('push-main');
    expect(targets).toContain('email-admin');
  });

  test('returns empty array for unknown event', () => {
    const router = new ChannelRouter(routes, allowlist);
    const targets = router.route('unknown.event', { channel: 'push-main', body: 'test' });
    expect(targets).toHaveLength(0);
  });

  test('send dispatches to allowed channel', () => {
    const router = new ChannelRouter(routes, allowlist);
    const result = router.send({ channel: 'push-main', body: 'hello' });
    expect(result.dispatched).toBe(true);
    expect(result.channel).toBe('push-main');
  });

  test('send rejects disallowed channel', () => {
    const router = new ChannelRouter(routes, allowlist);
    const result = router.send({ channel: 'unknown-channel', body: 'hello' });
    expect(result.dispatched).toBe(false);
  });

  test('addRoute adds new routing rule', () => {
    const router = new ChannelRouter(routes, allowlist);
    router.addRoute({ event: 'deploy.success', channels: ['push-main'] });
    const targets = router.route('deploy.success', { channel: 'push-main', body: 'deployed' });
    expect(targets).toContain('push-main');
  });

  test('removeRoute removes routing rule', () => {
    const router = new ChannelRouter(routes, allowlist);
    router.removeRoute('build.complete');
    const targets = router.route('build.complete', { channel: 'push-main', body: 'done' });
    expect(targets).toHaveLength(0);
  });
});

describe('SenderValidator', () => {
  test('validates allowed sender on allowed channel', () => {
    const validator = new SenderValidator(allowlist);
    expect(validator.validate('agent-1', 'push-main')).toBe(true);
  });

  test('rejects unknown sender', () => {
    const validator = new SenderValidator(allowlist);
    expect(validator.validate('unknown-sender', 'push-main')).toBe(false);
  });

  test('rejects sender on disallowed channel', () => {
    const validator = new SenderValidator(allowlist);
    expect(validator.validate('agent-1', 'unknown-channel')).toBe(false);
  });

  test('addSender adds new sender', () => {
    const validator = new SenderValidator(allowlist);
    validator.addSender('new-sender');
    expect(validator.validate('new-sender', 'push-main')).toBe(true);
  });

  test('removeSender removes sender', () => {
    const validator = new SenderValidator(allowlist);
    validator.removeSender('agent-1');
    expect(validator.validate('agent-1', 'push-main')).toBe(false);
  });
});
