export abstract class IEvent {
  public name: string = "";
  constructor() {}

  abstract execute(...args: unknown[]): Promise<void>;
}
