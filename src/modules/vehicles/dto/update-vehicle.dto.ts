import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';

/**
 * Every field is optional so the app can send one at a time. `null` is
 * rejected rather than skipped (`skipNullProperties: false`), as none of these
 * columns can be cleared.
 *
 * `image_ids`, when sent, replaces the whole photo list in the order given;
 * `[]` removes every photo.
 */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto, {
  skipNullProperties: false,
}) {}
