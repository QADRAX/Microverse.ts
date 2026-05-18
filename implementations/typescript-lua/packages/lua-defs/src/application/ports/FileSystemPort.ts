/**
 * Acceso a ficheros y rutas para el caso de uso de generación (sin acoplar a `node:fs`).
 */
export type FileSystemPort = {
  readonly readTextFile: (absolutePath: string) => Promise<string>;
  readonly writeTextFile: (absolutePath: string, content: string) => Promise<void>;
  /** Crea directorios padre del fichero de salida. */
  readonly mkdirpForFile: (absoluteFilePath: string) => Promise<void>;
  readonly resolve: (cwd: string, ...pathSegments: string[]) => string;
  readonly dirname: (absolutePath: string) => string;
};
