import { EntityTypeValue } from './entity/media.entity';

/** Keys match the `media` columns, so they can be handed straight to the repository. */
export interface CreateMediaData {
  user_id: string;
  entity_id?: string;
  entity_type?: EntityTypeValue;
  name: string;
  path: string;
  mime: string;
  size: number;
}
