import type { SecretEntry, SecretStore } from './types.js';
import { FileSecretStore } from './fallback.js';

export class KeychainStore implements SecretStore {
  private fallback: FileSecretStore;
  private useNative: boolean;

  constructor(filePath?: string) {
    this.fallback = new FileSecretStore(filePath);
    this.useNative = this.checkNativeAvailability();
  }

  private checkNativeAvailability(): boolean {
    // Native keychain integration (e.g., macOS Keychain, Windows Credential Manager)
    // is not available in all environments. Fall back to encrypted file store.
    // In a production build, this would attempt to load a native binding.
    return false;
  }

  get(service: string, key: string): string | null {
    if (this.useNative) {
      return this.nativeGet(service, key);
    }
    return this.fallback.get(service, key);
  }

  set(service: string, key: string, value: string): void {
    if (this.useNative) {
      this.nativeSet(service, key, value);
      return;
    }
    this.fallback.set(service, key, value);
  }

  delete(service: string, key: string): boolean {
    if (this.useNative) {
      return this.nativeDelete(service, key);
    }
    return this.fallback.delete(service, key);
  }

  list(service?: string): SecretEntry[] {
    if (this.useNative) {
      return this.nativeList(service);
    }
    return this.fallback.list(service);
  }

  private nativeGet(_service: string, _key: string): string | null {
    // Placeholder for native keychain access
    return null;
  }

  private nativeSet(_service: string, _key: string, _value: string): void {
    // Placeholder for native keychain access
  }

  private nativeDelete(_service: string, _key: string): boolean {
    // Placeholder for native keychain access
    return false;
  }

  private nativeList(_service?: string): SecretEntry[] {
    // Placeholder for native keychain access
    return [];
  }
}
