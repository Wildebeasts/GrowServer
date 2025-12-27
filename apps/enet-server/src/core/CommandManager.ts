import { ICommand } from "@/abstracts/ICommand";
import { Manager } from "@/abstracts/Manager";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";
import { readdirSync } from "fs";
import { join } from "path";

export class CommandManager extends Manager<ICommand> {

  public name = "CommandManager";
  public directory: string = join(__dirname, "..", "commands");

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
  @ThrowError("Failed to load commands on CommandManager")
  public async load() {
    const files = this.getFiles(this.directory);
    logger.info(`[${this.name}] Found ${files.length} command files.`);

    files.forEach(file => {
      this.register(file);
    });
  }

  @Debug()
  @ThrowError("Failed to register a command on CommandManager")
  public async register(filePath: string) {
    try {
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
