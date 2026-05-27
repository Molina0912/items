import { z } from 'zod';

export const PermissionSchema = z.enum(['allow', 'ask', 'deny']);
export type Permission = z.infer<typeof PermissionSchema>;

export const PermissionScopeSchema = z.enum(['tool', 'file', 'network', 'command']);
export type PermissionScope = z.infer<typeof PermissionScopeSchema>;

export const PermissionRuleSchema = z.object({
  pattern: z.string(),
  action: PermissionSchema,
  scope: PermissionScopeSchema.optional(),
});
export type PermissionRule = z.infer<typeof PermissionRuleSchema>;

export const PermissionModeSchema = z.enum(['auto', 'interactive', 'strict']);
export type PermissionMode = z.infer<typeof PermissionModeSchema>;

export interface PermissionContext {
  toolName?: string;
  filePath?: string;
  command?: string;
  url?: string;
  sessionId: string;
  mode: PermissionMode;
}

export interface PermissionDecision {
  action: Permission;
  remember: 'once' | 'session' | 'permanent';
}

export interface PermissionQuery {
  scope: string;
  resource: string;
  context: PermissionContext;
}
