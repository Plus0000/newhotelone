import { describe, it, expect } from 'vitest';
import { techBoundaries } from '@/data/techBoundaries';
import { techEntries } from '@/data/materials';

describe('techName 契约: techBoundaries <-> materials', () => {
  const materialNames = new Set(techEntries.map((t) => t.name));
  const boundaryNames = new Set(techBoundaries.map((b) => b.techName));

  it('techBoundaries 的每个 techName 必须在 materials.techEntries.name 集合内', () => {
    const mismatches = techBoundaries
      .filter((b) => !materialNames.has(b.techName))
      .map((b) => b.techName);
    expect(mismatches, `techBoundaries 里有但 materials 没有的 techName: ${mismatches.join(', ')}`).toEqual([]);
  });

  it('materials 的每个 name 必须有对应的 techBoundary', () => {
    const missing = techEntries
      .filter((t) => !boundaryNames.has(t.name))
      .map((t) => t.name);
    expect(missing, `materials 里有但 techBoundaries 没有的 name: ${missing.join(', ')}`).toEqual([]);
  });

  it('techBoundaries 和 materials 数量必须一致（12 个技术）', () => {
    expect(techBoundaries.length).toBe(techEntries.length);
  });
});
