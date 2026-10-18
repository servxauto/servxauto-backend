import type { IMedia } from '@/internals/media/types/media.types';
import type { IUser } from '@/modules/users/types/users.types';

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

export interface IVehicle {
  id: string;
  user_id: string;
  user: IUser;
  vehicle_no: string;
  brand: string;
  model: string;
  fuel_type: FuelTypeValue;
  images?: IVehicleImage[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IVehicleImage {
  id: string;
  vehicle_id: string;
  vehicle: IVehicle;
  media_id: string;
  media: IMedia;
  position: number;
  created_at: Date;
}

export type VehicleImageView = Pick<IMedia, 'id' | 'path'> &
  Pick<IVehicleImage, 'position'>;

export type VehicleView = Omit<IVehicle, 'images' | 'user'> & {
  images: VehicleImageView[];
};

export type VehicleLookupView = {
  vehicle_no: string;
  brand: string;
  model: string;
  fuel_type: FuelTypeValue;
};
