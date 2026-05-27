export interface MarketplacePlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  categories: string[];
}

export class MarketplaceClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://marketplace.expo.dev/api/v1') {
    this.baseUrl = baseUrl;
  }

  async search(query: string): Promise<MarketplacePlugin[]> {
    // Mock implementation - returns sample results matching query
    const allPlugins = this.getMockPlugins();
    const lowerQuery = query.toLowerCase();
    return allPlugins.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );
  }

  async getInfo(name: string): Promise<MarketplacePlugin | undefined> {
    const allPlugins = this.getMockPlugins();
    return allPlugins.find((p) => p.name === name);
  }

  async getFeatured(): Promise<MarketplacePlugin[]> {
    return this.getMockPlugins().slice(0, 3);
  }

  async getCategories(): Promise<string[]> {
    return ['tools', 'agents', 'themes', 'providers', 'commands'];
  }

  private getMockPlugins(): MarketplacePlugin[] {
    return [
      {
        name: '@expo/plugin-git',
        version: '1.0.0',
        description: 'Git integration tools for Expo CLI',
        author: 'expo',
        downloads: 1500,
        rating: 4.8,
        categories: ['tools'],
      },
      {
        name: '@expo/plugin-docker',
        version: '0.5.0',
        description: 'Docker container management',
        author: 'expo',
        downloads: 800,
        rating: 4.5,
        categories: ['tools', 'commands'],
      },
      {
        name: '@expo/plugin-themes',
        version: '1.2.0',
        description: 'Custom theme support for TUI',
        author: 'community',
        downloads: 2000,
        rating: 4.9,
        categories: ['themes'],
      },
    ];
  }
}
