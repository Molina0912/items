import { describe, test, expect } from 'bun:test';
import { evaluateConditionalBlocks } from '@expo/memory';
import type { MemoryContext } from '@expo/memory';

describe('evaluateConditionalBlocks', () => {
  test('includes matching conditional blocks', () => {
    const content = 'Before <!-- if(os:mac) -->Mac content<!-- endif --> after';
    const context: MemoryContext = { os: 'mac' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Before Mac content after');
  });

  test('removes non-matching conditional blocks', () => {
    const content = 'Before <!-- if(os:mac) -->Mac content<!-- endif --> after';
    const context: MemoryContext = { os: 'linux' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Before  after');
  });

  test('handles multiple conditional blocks', () => {
    const content = '<!-- if(os:mac) -->Mac<!-- endif --> and <!-- if(os:linux) -->Linux<!-- endif -->';
    const context: MemoryContext = { os: 'mac' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Mac and ');
  });

  test('handles complex conditions with AND', () => {
    const content = '<!-- if(os:mac AND tool:vscode) -->Mac+VSCode<!-- endif -->';
    const context: MemoryContext = { os: 'mac', tool: 'vscode' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Mac+VSCode');
  });

  test('handles OR conditions', () => {
    const content = '<!-- if(os:mac OR os:linux) -->Unix<!-- endif -->';
    const context: MemoryContext = { os: 'linux' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Unix');
  });

  test('handles NOT conditions', () => {
    const content = '<!-- if(NOT os:windows) -->Not Windows<!-- endif -->';
    const context: MemoryContext = { os: 'mac' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Not Windows');
  });

  test('preserves content outside conditional blocks', () => {
    const content = 'Static content with no conditions.';
    const context: MemoryContext = { os: 'mac' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Static content with no conditions.');
  });

  test('removes blocks with invalid conditions', () => {
    const content = 'Before <!-- if(!!invalid!!) -->content<!-- endif --> after';
    const context: MemoryContext = { os: 'mac' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('Before  after');
  });

  test('handles multiline content in blocks', () => {
    const content = `<!-- if(os:mac) -->
Line 1
Line 2
<!-- endif -->`;
    const context: MemoryContext = { os: 'mac' };
    const result = evaluateConditionalBlocks(content, context);
    expect(result).toBe('\nLine 1\nLine 2\n');
  });
});
