import { logger } from "@growserver/logger";

export function ThrowError(message?: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: unknown, ...args: unknown[]) {
      try {
        return originalMethod.apply(this, args);
      } catch (error) {
        const className = target.constructor.name;
        const msg = message || `Error in ${propertyKey}()`;
        logger.error(
          {
            className,
            method: propertyKey,
            error:  error instanceof Error ? error.message : String(error),
            stack:  error instanceof Error ? error.stack : undefined,
            args,
          },
          msg,
        );
        throw error;
      }
    };
    return descriptor;
  };
}
