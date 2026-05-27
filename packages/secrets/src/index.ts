export type { SecretEntry, SecretStore } from './types.js';
export { FileSecretStore } from './fallback.js';
export { KeychainStore } from './keychain.js';

import { KeychainStore } from './keychain.js';
import type { SecretStore } from './types.js';

export function createSecretStore(filePath?: string): SecretStore {
  return new KeychainStore(filePath);
}
