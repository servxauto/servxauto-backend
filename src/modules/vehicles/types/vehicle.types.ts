import { Media } from '@/internals/media/entity/media.entity';

/** What a vehicle's photos are reduced to in a response. */
export type VehicleImage = Pick<Media, 'id' | 'path'>;

/** Fuel types the "Fuel Type" picker offers. */
export const FuelType = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  CNG: 'cng',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
  LPG: 'lpg',
} as const;

export type FuelTypeValue = (typeof FuelType)[keyof typeof FuelType];

export interface VehicleLookupResult {
  vehicle_no: string;
  brand: string;
  model: string;
  fuel_type: FuelTypeValue;
}
