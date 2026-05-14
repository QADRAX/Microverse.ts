import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { FileSystemPort } from '../../application/ports/FileSystemPort.js';

export function createNodeFileSystemPort(): FileSystemPort {
  return {
    readTextFile: async (absolutePath) => readFile(absolutePath, 'utf8'),
    writeTextFile: async (absolutePath, content) => writeFile(absolutePath, content, 'utf8'),
    mkdirpForFile: async (absoluteFilePath) => {
      await mkdir(dirname(absoluteFilePath), { recursive: true });
    },
    resolve: (cwd, ...pathSegments) => resolve(cwd, ...pathSegments),
    dirname: (absolutePath) => dirname(absolutePath),
  };
}
