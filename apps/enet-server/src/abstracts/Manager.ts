import logger from "@growserver/logger";
import { Collection } from "@growserver/utils";
import { watch, type FSWatcher } from 'chokidar';
import { readdirSync } from "fs";
import { basename, join } from "path";

export abstract class Manager<T> {

  public name: string = "";
  public data = new Collection<string, T>();
  public directory: string = join(__dirname, "..", "commands");
  private watcher: FSWatcher | null = null;

  constructor() {}

  abstract init(): Promise<void>;
  abstract load(): Promise<void>;
  abstract register(filePath: string): Promise<void>;

  public getFile(filePath: string): T | undefined {
    try {
      if (require.cache[filePath]) {
        delete require.cache[filePath];
      }
      const rawModule = require(filePath);

      // TypeScript often compiles 'export default' to { default: Class }
      const Class = rawModule.default || rawModule;

      if (typeof Class !== 'function') return undefined;

      const instance: T = new Class();

      return instance;
    } catch (e) {
      return undefined;
    }
  }

  public getFiles(dir: string): string[] {
    const files: string[] = [];
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(dir, item.name);

      if (item.isDirectory()) {
        files.push(...this.getFiles(fullPath));
      } else if (
        item.isFile() &&
          (item.name.endsWith('.ts') || item.name.endsWith('.js'))
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }

  protected watch() {
    this.watcher = watch(this.directory, {
      /* eslint no-useless-escape: "off" */
      ignored:       /(^|[\/\\])\../,
      persistent:    true,
      ignoreInitial: true,
      depth:         99
    });

    this.watcher
      .on('add', (filePath) => {
        logger.info(`[${this.name}] [New File] ${basename(filePath)}`);
        this.register(filePath);
      })
      .on('change', (filePath) => {
        logger.info(`[${this.name}] Reloading ${basename(filePath)}...`);
        this.register(filePath);
      })
      .on('unlink', (filePath) => {
        // Optional: Handle file deletion (remove from map)
        logger.info(`[${this.name}] [Deleted] ${basename(filePath)}`);
        // Note: To delete correctly, you'd need to map paths to command names.
        // For now, a server restart handles deletions best.
      });

    logger.info(`[${this.name}] Watching for file changes`);
  }
}
