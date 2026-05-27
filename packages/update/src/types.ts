import { z } from 'zod';

export type UpdateChannel = 'stable' | 'beta' | 'canary';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  channel: UpdateChannel;
  updateAvailable: boolean;
  releaseNotes?: string;
}

export const UpdateChannelSchema = z.enum(['stable', 'beta', 'canary']);

export const UpdateInfoSchema = z.object({
  currentVersion: z.string(),
  latestVersion: z.string(),
  channel: UpdateChannelSchema,
  updateAvailable: z.boolean(),
  releaseNotes: z.string().optional(),
});
