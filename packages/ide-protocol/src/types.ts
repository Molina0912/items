import { z } from 'zod';

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: JsonRpcError;
}

export type IDEMethod =
  | 'session/start'
  | 'session/message'
  | 'session/end'
  | 'tools/list'
  | 'tools/call'
  | 'config/get'
  | 'config/set'
  | 'status/get';

export interface IDERequest {
  jsonrpc: '2.0';
  id: number | string;
  method: IDEMethod;
  params?: any;
}

export interface IDEResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: JsonRpcError;
}

export interface IDENotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export const JsonRpcMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.number(), z.string()]).optional(),
  method: z.string().optional(),
  params: z.any().optional(),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
});

export const IDEMethodSchema = z.enum([
  'session/start',
  'session/message',
  'session/end',
  'tools/list',
  'tools/call',
  'config/get',
  'config/set',
  'status/get',
]);
