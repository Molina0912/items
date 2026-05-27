export interface SecretEntry {
  key: string;
  value: string;
  service: string;
  createdAt: string;
}

export interface SecretStore {
  get(service: string, key: string): string | null;
  set(service: string, key: string, value: string): void;
  delete(service: string, key: string): boolean;
  list(service?: string): SecretEntry[];
}
