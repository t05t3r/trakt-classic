import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkCliArgs } from './checkCliArgs.ts';

describe('checkCliArgs', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'check-cli-args-test-'),
    );
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('stray arguments', () => {
    it('should reject an unknown long option and show the usage', async () => {
      await expect(checkCliArgs(['-i', tempDir, '--bogus'])).rejects.toThrow(
        "Unknown option '--bogus'",
      );
      expect(console.error).toHaveBeenCalledWith(
        "❌ Error: Unknown option '--bogus'",
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });

    it('should reject an unknown short option and show the usage', async () => {
      await expect(checkCliArgs(['-i', tempDir, '-x'])).rejects.toThrow(
        "Unknown option '-x'",
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });

    it('should reject an unknown option even with help', async () => {
      await expect(checkCliArgs(['--help', '--bogus'])).rejects.toThrow(
        "Unknown option '--bogus'",
      );
    });

    it('should reject a positional argument and show the usage', async () => {
      await expect(checkCliArgs(['-i', tempDir, 'foo'])).rejects.toThrow(
        "Unexpected argument 'foo'",
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });

    it('should reject a positional argument after --', async () => {
      await expect(checkCliArgs(['-i', tempDir, '--', 'foo'])).rejects
        .toThrow("Unexpected argument 'foo'");
    });

    it('should reject a trailing output option without a value', async () => {
      await expect(checkCliArgs(['-i', tempDir, '-o'])).rejects.toThrow(
        "Option '-o, --output <value>' argument missing",
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });
  });

  describe('input', () => {
    it('should require an input and show the usage', async () => {
      await expect(checkCliArgs([])).rejects.toThrow(
        'Input directory is required',
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });

    it('should reject a file input and show the usage', async () => {
      const filePath = path.join(tempDir, 'en.json');
      await fs.promises.writeFile(filePath, '{}');

      await expect(
        checkCliArgs(['-i', filePath]),
      ).rejects.toThrow('Input must be a directory containing meta files');
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error: Input must be a directory containing meta files',
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });

    it('should reject a path that does not exist and show the usage', async () => {
      await expect(
        checkCliArgs(['-i', path.join(tempDir, 'missing')]),
      ).rejects.toThrow('ENOENT');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/^❌ Error: /),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: generate-i18n'),
      );
    });
  });

  describe('accepted arguments', () => {
    it('should parse the i18n:generate arguments', async () => {
      await expect(checkCliArgs(['-i', tempDir, '-o', 'i18n/']))
        .resolves.toEqual({
          help: false,
          input: tempDir,
          output: 'i18n/',
          platforms: undefined,
          watch: false,
        });
    });

    it('should parse the i18n:generate:watch arguments', async () => {
      await expect(
        checkCliArgs(['-i', tempDir, '-o', 'i18n/', '--watch']),
      ).resolves.toEqual({
        help: false,
        input: tempDir,
        output: 'i18n/',
        platforms: undefined,
        watch: true,
      });
    });

    it('should parse the i18n:web arguments', async () => {
      await expect(
        checkCliArgs([
          '-i',
          tempDir,
          '-o',
          'i18n/',
          '--platforms',
          'web',
        ]),
      ).resolves.toEqual({
        help: false,
        input: tempDir,
        output: 'i18n/',
        platforms: 'web',
        watch: false,
      });
    });

    it('should parse the short aliases', async () => {
      await expect(
        checkCliArgs(['-i', tempDir, '-o', 'out/', '-p', 'web', '-w']),
      ).resolves.toEqual({
        help: false,
        input: tempDir,
        output: 'out/',
        platforms: 'web',
        watch: true,
      });
    });

    it('should return help without requiring an input', async () => {
      await expect(checkCliArgs(['-h'])).resolves.toEqual({ help: true });
    });
  });
});
