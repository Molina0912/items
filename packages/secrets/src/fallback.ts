import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { homedir } from 'node:os';
import type { SecretEntry, SecretStore } from './types.js';

interface EncryptedData {
  iv: string;
  tag: string;
  data: string;
}

export class FileSecretStore implements SecretStore {
  private filePath: string;
  private encryptionKey: Buffer;
  private keyFilePath: string;

  constructor(filePath?: string, keyFilePath?: string) {
    this.filePath = filePath ?? join(homedir(), '.expo', 'secrets.enc');
    this.keyFilePath = keyFilePath ?? join(homedir(), '.expo', '.secret-key');
    this.encryptionKey = this.deriveKey();
  }

  private deriveKey(): Buffer {
    const keyMaterial = this.loadOrCreateKeyMaterial();
    return scryptSync(keyMaterial, 'expo-secrets-salt', 32);
  }

  private loadOrCreateKeyMaterial(): Buffer {
    if (existsSync(this.keyFilePath)) {
      return Buffer.from(readFileSync(this.keyFilePath, 'utf-8').trim(), 'hex');
    }

    const dir = dirname(this.keyFilePath);
    mkdirSync(dir, { recursive: true });

    const key = randomBytes(32);
    writeFileSync(this.keyFilePath, key.toString('hex'), { mode: 0o600 });

    try {
      chmodSync(this.keyFilePath, 0o600);
    } catch {
      // chmod may fail on some platforms (e.g., Windows), mode in writeFileSync is sufficient
    }

    return key;
  }

  private encrypt(plaintext: string): EncryptedData {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted,
    };
  }

  private decrypt(encrypted: EncryptedData): string {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const tag = Buffer.from(encrypted.tag, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }

  private readStore(): SecretEntry[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      const encrypted: EncryptedData = JSON.parse(raw);
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as SecretEntry[];
    } catch {
      // Handle corruption gracefully
      return [];
    }
  }

  private writeStore(entries: SecretEntry[]): void {
    const dir = dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    const plaintext = JSON.stringify(entries);
    const encrypted = this.encrypt(plaintext);
    writeFileSync(this.filePath, JSON.stringify(encrypted));
  }

  get(service: string, key: string): string | null {
    const entries = this.readStore();
    const entry = entries.find((e) => e.service === service && e.key === key);
    return entry?.value ?? null;
  }

  set(service: string, key: string, value: string): void {
    const entries = this.readStore();
    const index = entries.findIndex((e) => e.service === service && e.key === key);
    const entry: SecretEntry = {
      key,
      value,
      service,
      createdAt: new Date().toISOString(),
    };
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    this.writeStore(entries);
  }

  delete(service: string, key: string): boolean {
    const entries = this.readStore();
    const index = entries.findIndex((e) => e.service === service && e.key === key);
    if (index < 0) {
      return false;
    }
    entries.splice(index, 1);
    this.writeStore(entries);
    return true;
  }

  list(service?: string): SecretEntry[] {
    const entries = this.readStore();
    if (service) {
      return entries.filter((e) => e.service === service);
    }
    return entries;
  }
}
