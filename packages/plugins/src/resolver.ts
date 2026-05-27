import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ResolvedPlugin {
  type: 'npm' | 'local' | 'git';
  source: string;
  url: string;
}

export class PluginResolver {
  resolveFromNpm(name: string): ResolvedPlugin {
    const registryUrl = `https://registry.npmjs.org/${name}`;
    return {
      type: 'npm',
      source: name,
      url: registryUrl,
    };
  }

  resolveFromLocal(path: string): ResolvedPlugin {
    const absolutePath = resolve(path);
    if (!existsSync(absolutePath)) {
      throw new Error(`Local plugin path does not exist: ${absolutePath}`);
    }
    return {
      type: 'local',
      source: path,
      url: absolutePath,
    };
  }

  resolveFromGit(url: string): ResolvedPlugin {
    if (!url.match(/^(https?:\/\/|git@|git:\/\/)/)) {
      throw new Error(`Invalid git URL: ${url}`);
    }
    return {
      type: 'git',
      source: url,
      url,
    };
  }

  resolve(source: string): ResolvedPlugin {
    if (source.startsWith('.') || source.startsWith('/')) {
      return this.resolveFromLocal(source);
    }
    if (source.match(/^(https?:\/\/|git@|git:\/\/)/)) {
      return this.resolveFromGit(source);
    }
    return this.resolveFromNpm(source);
  }
}
