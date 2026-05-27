import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadSkills } from '@expo/cli';

const TEST_DIR = join(import.meta.dir, '.tmp-skills-loader');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('loadSkills', () => {
  test('loads markdown skill files', () => {
    writeFileSync(
      join(TEST_DIR, 'code-review.md'),
      `---
name: code-review
description: Review code for issues
tools: [bash, read_file]
model: gpt-4
---
You are a code reviewer. Analyze the code for bugs and style issues.`
    );

    const skills = loadSkills(TEST_DIR);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('code-review');
    expect(skills[0].description).toBe('Review code for issues');
    expect(skills[0].tools).toEqual(['bash', 'read_file']);
    expect(skills[0].model).toBe('gpt-4');
    expect(skills[0].prompt).toContain('code reviewer');
  });

  test('loads JSON skill files', () => {
    writeFileSync(
      join(TEST_DIR, 'skills.json'),
      JSON.stringify({
        skills: [
          { name: 'refactor', description: 'Refactor code', prompt: 'Refactor the code.' },
          { name: 'test', description: 'Write tests', prompt: 'Write tests for the code.' },
        ],
      })
    );

    const skills = loadSkills(TEST_DIR);
    expect(skills).toHaveLength(2);
    expect(skills[0].name).toBe('refactor');
    expect(skills[1].name).toBe('test');
  });

  test('loads single JSON skill', () => {
    writeFileSync(
      join(TEST_DIR, 'single.json'),
      JSON.stringify({ name: 'debug', description: 'Debug code', prompt: 'Debug.' })
    );

    const skills = loadSkills(TEST_DIR);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('debug');
  });

  test('uses filename as fallback name for md skills', () => {
    writeFileSync(join(TEST_DIR, 'my-skill.md'), 'Do something useful.');

    const skills = loadSkills(TEST_DIR);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('my-skill');
    expect(skills[0].prompt).toBe('Do something useful.');
  });

  test('returns empty array for non-existent directory', () => {
    const skills = loadSkills('/does/not/exist');
    expect(skills).toEqual([]);
  });

  test('loads skills with list-style tools in frontmatter', () => {
    writeFileSync(
      join(TEST_DIR, 'deploy.md'),
      `---
name: deploy
description: Deploy application
tools:
  - bash
  - docker
---
Deploy the application.`
    );

    const skills = loadSkills(TEST_DIR);
    expect(skills).toHaveLength(1);
    expect(skills[0].tools).toEqual(['bash', 'docker']);
  });

  test('ignores non-md and non-json files', () => {
    writeFileSync(join(TEST_DIR, 'readme.txt'), 'Not a skill');
    writeFileSync(join(TEST_DIR, 'skill.md'), 'A real skill.');

    const skills = loadSkills(TEST_DIR);
    expect(skills).toHaveLength(1);
  });
});
