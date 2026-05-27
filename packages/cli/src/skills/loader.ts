import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { Skill, SkillManifest } from './types.js';

interface SkillFrontmatter {
  name?: string;
  description?: string;
  tools?: string[];
  model?: string;
}

function parseMdSkill(content: string, fallbackName: string): Skill {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { name: fallbackName, description: '', prompt: content };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const frontmatter: SkillFrontmatter = {};

  const lines = yamlBlock.split('\n');
  let currentKey: string | null = null;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    const keyMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey === 'tools' && arrayValues.length > 0) {
        frontmatter.tools = arrayValues;
        arrayValues = [];
      }

      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      if (currentKey === 'name' && value) {
        frontmatter.name = value.replace(/^['"]|['"]$/g, '');
        currentKey = null;
      } else if (currentKey === 'description' && value) {
        frontmatter.description = value.replace(/^['"]|['"]$/g, '');
        currentKey = null;
      } else if (currentKey === 'model' && value) {
        frontmatter.model = value.replace(/^['"]|['"]$/g, '');
        currentKey = null;
      } else if (currentKey === 'tools' && value) {
        const inlineMatch = value.match(/^\[(.*)\]$/);
        if (inlineMatch) {
          frontmatter.tools = inlineMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          currentKey = null;
        }
      }
    } else if (currentKey === 'tools' && trimmed.startsWith('- ')) {
      arrayValues.push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
    }
  }

  if (currentKey === 'tools' && arrayValues.length > 0) {
    frontmatter.tools = arrayValues;
  }

  return {
    name: frontmatter.name ?? fallbackName,
    description: frontmatter.description ?? '',
    prompt: body,
    tools: frontmatter.tools,
    model: frontmatter.model,
  };
}

function parseJsonSkill(content: string): Skill[] {
  const parsed = JSON.parse(content) as Skill | SkillManifest;
  if ('skills' in parsed && Array.isArray(parsed.skills)) {
    return parsed.skills;
  }
  return [parsed as Skill];
}

export function loadSkills(dir: string): Skill[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  const skills: Skill[] = [];

  for (const entry of entries) {
    const filePath = join(dir, entry);
    const ext = extname(entry);
    const baseName = entry.replace(ext, '');

    try {
      const content = readFileSync(filePath, 'utf-8');

      if (ext === '.md') {
        skills.push(parseMdSkill(content, baseName));
      } else if (ext === '.json') {
        skills.push(...parseJsonSkill(content));
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return skills;
}
