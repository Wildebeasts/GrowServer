import logger from "@growserver/logger";
import { Collection } from "@growserver/utils";
import { watch, type FSWatcher } from 'chokidar';
import { readdirSync } from "fs";
import { basename, join } from "path";

export abstract class Manager<T> {

  public name: string = "";
  public data = new Collection<string, T>();
  public directories: string[] = [];
  private watchers: FSWatcher[] = [];

  constructor() {}

  abstract init(): Promise<void>;
  abstract load(index: number): Promise<void>;
  abstract loadAll(): Promise<void>;
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
    for (const directory of this.directories) {
      const watcher = watch(directory, {
        /* eslint no-useless-escape: "off" */
        ignored:       /(^|[\/\\])\../,
        persistent:    true,
        ignoreInitial: true,
        depth:         99
      });

      watcher
        .on('add', (filePath) => {
          logger.info(`[${this.name}] [New File] ${basename(filePath)}`);
          this.reloadMainDirectory();
        })
        .on('change', (filePath) => {
          logger.info(`[${this.name}] File changed: ${basename(filePath)}`);
          this.reloadMainDirectory();
        })
        .on('unlink', (filePath) => {
          logger.info(`[${this.name}] [Deleted] ${basename(filePath)}`);
          this.reloadMainDirectory();
        });

      this.watchers.push(watcher);
    }

    logger.info(`[${this.name}] Watching ${this.directories.length} directories for file changes`);
  }

  private reloadMainDirectory() {
    if (this.directories.length === 0) return;
    
    const mainDirectory = this.directories[0];
    const files = this.getFiles(mainDirectory);
    
    this.data.clear();
    
    logger.info(`[${this.name}] Reloading ${files.length} files from main directory`);
    
    files.forEach(file => {
      this.register(file);
    });
  }


  protected clearModuleCache(filePath: string) {
    const resolvedPath = require.resolve(filePath);
    const module = require.cache[resolvedPath];
    
    if (module) {
      // Recursively clear child modules, but only those within the project
      module.children.forEach((child) => {
        // Only clear modules that are within the project directory
        // Skip node_modules and Node.js internal modules
        if (child.id.includes('node_modules') || !child.id.includes('enet-server')) {
          return;
        }
        this.clearModuleCache(child.id);
      });
      
      // Delete the module from cache
      delete require.cache[resolvedPath];
    }
  }
}
