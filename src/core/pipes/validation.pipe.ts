import { ValidationError, ValidationPipe } from '@nestjs/common';
import { InvalidRequestException } from '@/core/exceptions/app-http.exception';

/**
 * Flattens nested validation errors (e.g. nested DTOs / arrays)
 * into `{ path, constraints }` pairs such as `address.city`.
 */
function flattenErrors(
  errors: ValidationError[],
  parentPath = '',
): { path: string; constraints: Record<string, string> }[] {
  return errors.flatMap((error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own = error.constraints
      ? [{ path, constraints: error.constraints }]
      : [];
    return [...own, ...flattenErrors(error.children ?? [], path)];
  });
}

/**
 * Builds the single error message reported for a failed validation:
 * missing required fields first, otherwise the invalid field messages.
 */
function buildValidationMessage(errors: ValidationError[]): string {
  const flat = flattenErrors(errors);

  const missingFields = flat
    .filter((e) => e.constraints.isNotEmpty || e.constraints.isDefined)
    .map((e) => e.path);

  if (missingFields.length > 0) {
    return `Missing fields: ${missingFields.join(', ')}`;
  }

  const invalid = flat.flatMap((e) => Object.values(e.constraints));
  return `Invalid fields: ${invalid.join(', ')}`;
}

/**
 * Global validation pipe built on Nest's ValidationPipe, reporting
 * failures in the app's standard error format.
 */
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) =>
        new InvalidRequestException(buildValidationMessage(errors)),
    });
  }
}
