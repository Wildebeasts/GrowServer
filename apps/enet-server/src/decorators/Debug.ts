import { logger } from "@growserver/logger";

export function Debug(message?: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const className = target.constructor.name;
      const msg = message || `${propertyKey}()`;
      if (args.length > 0) {
        logger.debug({ className, method: msg, args }, "Method called");
      } else {
        logger.debug({ className, method: msg }, "Method called");
      }
      const result = originalMethod.apply(this, args);
      logger.debug({ className, method: msg }, "Method completed");
      return result;
    };
    return descriptor;
  };
}
