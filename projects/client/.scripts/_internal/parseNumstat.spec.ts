import { describe, expect, it } from 'vitest';
import { parseNumstat } from './parseNumstat.ts';

describe('parseNumstat', () => {
  it('should count added plus deleted lines', () => {
    expect(parseNumstat('3\t4\tsrc/a.ts\n')).toBe(7);
  });

  it('should count a one-sided change', () => {
    expect(
      parseNumstat(
        '0\t2\t{/tmp/upstream/projects => projects}/client/deno.json\n',
      ),
    ).toBe(2);
  });

  it('should count no lines for empty output', () => {
    expect(parseNumstat('')).toBe(0);
  });

  it('should report no count for a binary file', () => {
    expect(parseNumstat('-\t-\tstatic/a.png\n')).toBeUndefined();
  });

  it('should throw on output that is not a numstat record', () => {
    expect(() => parseNumstat('error: could not access src/a.ts\n'))
      .toThrow('not a numstat record');
  });

  it('should throw on more than one numstat record', () => {
    expect(() => parseNumstat('1\t2\tsrc/a.ts\n3\t4\tsrc/b.ts\n'))
      .toThrow('not a numstat record');
  });
});
