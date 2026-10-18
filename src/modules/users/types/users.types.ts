import type { IMedia } from '@/internals/media/types/media.types';

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

export type GenderType = (typeof Gender)[keyof typeof Gender];

export interface IUser {
  id: string;
  name: string | null;
  avatar_id: string | null;
  avatar: IMedia | null;
  phone_no: string;
  email: string | null;
  gender: GenderType | null;
  referral_code: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
