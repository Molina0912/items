export type {
  LSPServerConfig,
  LSPClientState,
  DiagnosticRange,
  Position,
  Diagnostic,
  DocumentChange,
  LSPMessage,
  LSPTransportInterface,
} from './types.js';

export { DiagnosticSeverity } from './types.js';

export { LSPClient } from './client.js';
export type { LSPClientOptions } from './client.js';

export { LSPClientPool } from './pool.js';

export { LANGUAGE_SERVERS } from './languages.js';

export { DiagnosticCollector } from './diagnostics.js';

export { DocumentSyncManager } from './sync.js';
