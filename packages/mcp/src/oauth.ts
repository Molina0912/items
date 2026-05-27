import type { MCPOAuthConfig } from './types.js';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

export class MCPOAuth {
  private config: MCPOAuthConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;
  private fetchFn: typeof fetch;

  constructor(config: MCPOAuthConfig, fetchFn?: typeof fetch) {
    this.config = config;
    this.fetchFn = fetchFn ?? fetch;
  }

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      return this.refresh();
    }

    return this.authenticate();
  }

  async authenticate(): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.set('client_secret', this.config.clientSecret);
    }

    if (this.config.scopes?.length) {
      params.set('scope', this.config.scopes.join(' '));
    }

    const response = await this.fetchFn(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TokenResponse;
    this.setToken(data);
    return this.accessToken!;
  }

  async refresh(): Promise<string> {
    if (!this.refreshToken) {
      return this.authenticate();
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: this.refreshToken,
    });

    if (this.config.clientSecret) {
      params.set('client_secret', this.config.clientSecret);
    }

    const response = await this.fetchFn(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      // If refresh fails, try full authentication
      this.refreshToken = null;
      return this.authenticate();
    }

    const data = (await response.json()) as TokenResponse;
    this.setToken(data);
    return this.accessToken!;
  }

  getAuthorizationHeader(): string | null {
    if (!this.accessToken) return null;
    return `Bearer ${this.accessToken}`;
  }

  private setToken(data: TokenResponse): void {
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token ?? this.refreshToken;
    this.expiresAt = data.expires_in
      ? Date.now() + data.expires_in * 1000 - 30000 // 30s buffer
      : Date.now() + 3600000; // Default 1 hour
  }
}
