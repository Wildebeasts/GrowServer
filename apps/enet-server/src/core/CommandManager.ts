import { ICommand } from "@/abstracts/ICommand";
import { Manager } from "@/abstracts/Manager";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";
import { readdirSync } from "fs";
import { join } from "path";

export class CommandManager extends Manager<ICommand> {

  public name = "CommandManager";
  public directories: string[] = [
    join(__dirname, "..", "commands")
  ];

  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to initialize CommandManager")
  public async init(){
    this.load();
    this.watch();
  }

  @Debug()
  @ThrowError("Failed to loadAll command on CommandManager")
  public async loadAll() {
    let allFiles: string[] = [];
    
    for (const directory of this.directories) {
      const files = this.getFiles(directory);
      allFiles = allFiles.concat(files);
    }
    
    logger.info(`[${this.name}] Found ${allFiles.length} event files across ${this.directories.length} directories.`);

    allFiles.forEach(file => {
      console.log(file);
      this.register(file);
    });
  }

  @Debug()
  @ThrowError("Failed to load command on CommandManager")
  public async load(index: number = 0) {
    const files = this.getFiles(this.directories[index]);

    logger.info(`[${this.name}] Found ${files.length} event files.`);
    for (const file of files) {
      this.register(file);
    }
  }

  @Debug()
  @ThrowError("Failed to register a command on CommandManager")
  public async register(filePath: string) {
    try {
      this.clearModuleCache(filePath);
      const commandInstance = this.getFile(filePath);

      if (!commandInstance) throw new Error(`[${this.name}] No file found`);

      const commandName = commandInstance.opt.name;

      if (this.data.has(commandName)) {
        this.data.delete(commandName);
        this.data.set(commandName, commandInstance);
        logger.info(`[${this.name}] Reloaded: ${commandName}`);
      } else {
        this.data.set(commandName, commandInstance);
        logger.info(`[${this.name}] Loaded: ${commandName}`);

      }

    } catch (error) {
      logger.error(`[${this.name}] Failed to load ${filePath}: ${error}`);
    }
  }

  @Debug()
  @ThrowError("Failed to get a directory on CommandManager")
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


}
