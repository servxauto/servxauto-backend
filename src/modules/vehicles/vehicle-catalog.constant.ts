import { FuelType, FuelTypeValue } from './types/vehicles.types';

export interface CatalogModel {
  name: string;
  /** A lookup picks one of these. */
  fuel_types: FuelTypeValue[];
}

export interface CatalogBrand {
  name: string;
  models: CatalogModel[];
}

/**
 * Stand-in until the registration-details provider is wired up. Each model
 * carries only the fuels it ships with, so a Nexon EV never comes back diesel.
 */
export const VEHICLE_CATALOG: CatalogBrand[] = [
  {
    name: 'Maruti Suzuki',
    models: [
      { name: 'Swift', fuel_types: [FuelType.PETROL, FuelType.CNG] },
      { name: 'Baleno', fuel_types: [FuelType.PETROL, FuelType.CNG] },
      { name: 'Dzire', fuel_types: [FuelType.PETROL, FuelType.CNG] },
      { name: 'Brezza', fuel_types: [FuelType.PETROL, FuelType.CNG] },
      { name: 'Ertiga', fuel_types: [FuelType.PETROL, FuelType.CNG] },
    ],
  },
  {
    name: 'Hyundai',
    models: [
      { name: 'i20', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Creta', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Venue', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Verna', fuel_types: [FuelType.PETROL] },
      { name: 'Exter', fuel_types: [FuelType.PETROL, FuelType.CNG] },
    ],
  },
  {
    name: 'Tata',
    models: [
      { name: 'Nexon', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Nexon EV', fuel_types: [FuelType.ELECTRIC] },
      { name: 'Punch', fuel_types: [FuelType.PETROL, FuelType.CNG] },
      { name: 'Altroz', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Harrier', fuel_types: [FuelType.DIESEL] },
    ],
  },
  {
    name: 'Mahindra',
    models: [
      { name: 'XUV700', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Scorpio-N', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Thar', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Bolero', fuel_types: [FuelType.DIESEL] },
      { name: 'XUV 3XO', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
    ],
  },
  {
    name: 'Honda',
    models: [
      { name: 'City', fuel_types: [FuelType.PETROL, FuelType.HYBRID] },
      { name: 'Amaze', fuel_types: [FuelType.PETROL] },
      { name: 'Elevate', fuel_types: [FuelType.PETROL] },
    ],
  },
  {
    name: 'Toyota',
    models: [
      { name: 'Innova Crysta', fuel_types: [FuelType.DIESEL] },
      {
        name: 'Innova Hycross',
        fuel_types: [FuelType.PETROL, FuelType.HYBRID],
      },
      { name: 'Fortuner', fuel_types: [FuelType.DIESEL] },
      { name: 'Glanza', fuel_types: [FuelType.PETROL, FuelType.CNG] },
    ],
  },
  {
    name: 'Kia',
    models: [
      { name: 'Seltos', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Sonet', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Carens', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
    ],
  },
  {
    name: 'MG',
    models: [
      { name: 'Hector', fuel_types: [FuelType.PETROL, FuelType.DIESEL] },
      { name: 'Astor', fuel_types: [FuelType.PETROL] },
      { name: 'ZS EV', fuel_types: [FuelType.ELECTRIC] },
      { name: 'Comet EV', fuel_types: [FuelType.ELECTRIC] },
    ],
  },
  {
    name: 'Renault',
    models: [
      { name: 'Kwid', fuel_types: [FuelType.PETROL] },
      { name: 'Triber', fuel_types: [FuelType.PETROL, FuelType.LPG] },
      { name: 'Kiger', fuel_types: [FuelType.PETROL] },
    ],
  },
  {
    name: 'Volkswagen',
    models: [
      { name: 'Virtus', fuel_types: [FuelType.PETROL] },
      { name: 'Taigun', fuel_types: [FuelType.PETROL] },
    ],
  },
];
