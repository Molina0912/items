import type { UpdateChannel } from './types.js';

export function resolveChannel(channel: UpdateChannel): string {
  switch (channel) {
    case 'stable':
      return 'latest';
    case 'beta':
      return 'beta';
    case 'canary':
      return 'canary';
    default:
      return 'latest';
  }
}

export function getAvailableChannels(): UpdateChannel[] {
  return ['stable', 'beta', 'canary'];
}

export function getCurrentChannel(version: string): UpdateChannel {
  if (version.includes('canary') || version.includes('alpha')) {
    return 'canary';
  }
  if (version.includes('beta') || version.includes('rc')) {
    return 'beta';
  }
  return 'stable';
}
