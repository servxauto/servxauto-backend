/** What an uploaded file is attached to. */
export const EntityType = {
  USER: 'USER',
  VEHICLE: 'VEHICLE',
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

export interface IMedia {
  id: string;
  user_id: string | null;
  entity_id: string | null;
  entity_type: EntityTypeValue | null;
  name: string;
  path: string;
  size: number;
  mime: string;
  uploaded_at: Date;
}

/** Keys match the `media` columns, so they can be handed straight to the repository. */
export interface CreateMediaData {
  user_id: string | null;
  entity_id?: string;
  entity_type?: EntityTypeValue;
  name: string;
  path: string;
  mime: string;
  size: number;
}
