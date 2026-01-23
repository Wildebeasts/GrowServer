import { IEvent } from "@/abstracts/IEvent";
import { Manager } from "@/abstracts/Manager";
import { Debug, ThrowError } from "@/decorators";
import logger from "@growserver/logger";
import { readdirSync } from "fs";
import { join } from "path";

export class EventManager extends Manager<IEvent> {

  public name = "EventManager";
  public directories: string[] = [
    join(__dirname, "..", "network", "events"),
    join(__dirname, "..", "network", "packets")
  ];

  constructor() {
    super();
  }

  @Debug()
  @ThrowError("Failed to initialize EventManager")
  public async init(){
    this.load();
    this.watch();
  }

  @Debug()
  @ThrowError("Failed to loadAll events on EventManager")
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
  @ThrowError("Failed to load events on EventManager")
  public async load(index: number = 0) {
    const files = this.getFiles(this.directories[index]);

    logger.info(`[${this.name}] Found ${files.length} event files.`);
    for (const file of files) {
      this.register(file);
    }
  }


  @Debug()
  @ThrowError("Failed to register a event on EventManager")
  public async register(filePath: string) {
    try {
      this.clearModuleCache(filePath);
      const eventInstance = this.getFile(filePath);

      if (!eventInstance) throw new Error(`[${this.name}] No file found`);

      const eventName = eventInstance.name;

      if (this.data.has(eventName)) {
        this.data.delete(eventName);
        this.data.set(eventName, eventInstance);
        logger.info(`[${this.name}] Reloaded: ${eventName}`);
      } else {
        this.data.set(eventName, eventInstance);
        logger.info(`[${this.name}] Loaded: ${eventName}`);
      }

    } catch (error) {
      logger.error(`[${this.name}] Failed to load ${filePath}: ${error}`);
    }
  }

  @Debug()
  @ThrowError("Failed to get a directory on EventManager")
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
