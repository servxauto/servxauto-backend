import type { IMedia } from '@/internals/media/types/media.types';

/**
 * The six onboarding steps, in order. `current_step` holds the step the
 * partner still has to complete.
 */
export const WorkshopApplicationStep = {
  BUSINESS_DETAILS: 'business_details',
  SHOP_LOCATION: 'shop_location',
  DOCUMENTS: 'documents',
  WORKING_HOURS: 'working_hours',
  REVIEW: 'review',
  AGREEMENTS: 'agreements',
} as const;

export type WorkshopApplicationStepType =
  (typeof WorkshopApplicationStep)[keyof typeof WorkshopApplicationStep];

/**
 * Where the application sits overall: the partner fills it in
 * (`IN_PROGRESS`), submits it (`SUBMITTED`), and an admin either approves or
 * rejects it. A rejected application can be edited and submitted again.
 */
export const WorkshopApplicationStatus = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type WorkshopApplicationStatusType =
  (typeof WorkshopApplicationStatus)[keyof typeof WorkshopApplicationStatus];

/** In display order, Monday first, as the working-hours screen lists them. */
export const WeekDay = {
  MON: 'mon',
  TUE: 'tue',
  WED: 'wed',
  THU: 'thu',
  FRI: 'fri',
  SAT: 'sat',
  SUN: 'sun',
} as const;

export type WeekDayValue = (typeof WeekDay)[keyof typeof WeekDay];

export const WorkshopAgreementType = {
  TERMS_OF_SERVICE: 'terms_of_service',
  COMMISSION_AGREEMENT: 'commission_agreement',
  DATA_PRIVACY_CONSENT: 'data_privacy_consent',
} as const;

export type WorkshopAgreementTypeValue =
  (typeof WorkshopAgreementType)[keyof typeof WorkshopAgreementType];

/**
 * The version of each agreement a workshop must accept today. Bumping one
 * makes every workshop's earlier acceptance of it stop counting.
 */
export const WORKSHOP_AGREEMENT_VERSIONS: Record<
  WorkshopAgreementTypeValue,
  string
> = {
  terms_of_service: '2026-10-01',
  commission_agreement: '2026-10-01',
  data_privacy_consent: '2026-10-01',
};

export interface IWorkshop {
  id: string;
  phone_no: string;
  email: string | null;
  business_name: string | null;
  owner_name: string | null;
  gst_no: string | null;
  address?: IWorkshopAddress | null;
  images?: IWorkshopImage[];
  documents?: IWorkshopDocument[];
  working_hours?: IWorkshopWorkingHour[];
  agreements?: IWorkshopAgreement[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/** A Google Places result plus the shop details the partner types in. */
export interface IWorkshopAddress {
  id: string;
  workshop_id: string;
  workshop: IWorkshop;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  shop_no: string;
  landmark: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IWorkshopImage {
  id: string;
  workshop_id: string;
  workshop: IWorkshop;
  media_id: string;
  media: IMedia;
  position: number;
  created_at: Date;
}

export interface IWorkshopDocument {
  id: string;
  workshop_id: string;
  workshop: IWorkshop;
  media_id: string;
  media: IMedia;
  /** `key` of the requirement in the application's snapshot, e.g. `aadhaar_card`. */
  document_key: string;
  sort_order: number;
  created_at: Date;
}

/** A document workshops have to upload, as an admin defines it. */
export interface IWorkshopDocumentRequirement {
  id: string;
  key: string;
  name: string;
  /** Free text shown under the name, e.g. "Photo of front & back". */
  description: string | null;
  min_images: number;
  max_images: number;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** One requirement as copied onto an application when it is created. */
export type WorkshopDocumentRequirementSnapshot = Omit<
  IWorkshopDocumentRequirement,
  'id' | 'is_active' | 'created_at' | 'updated_at'
>;

export interface IWorkshopWorkingHour {
  id: string;
  workshop_id: string;
  workshop: IWorkshop;
  day: WeekDayValue;
  is_open: boolean;
  /** `HH:mm:ss`, as Postgres returns a `time`. Null when closed. */
  opens_at: string | null;
  closes_at: string | null;
}

export interface IWorkshopAgreement {
  id: string;
  workshop_id: string;
  workshop: IWorkshop;
  type: WorkshopAgreementTypeValue;
  version: string;
  accepted_at: Date;
}

/** What a stored photo is reduced to in a response. */
export type WorkshopImageView = Pick<IMedia, 'id' | 'path'> &
  Pick<IWorkshopImage, 'position'>;

export type WorkshopDocumentView = Pick<IMedia, 'id' | 'path'> &
  Pick<IWorkshopDocument, 'document_key' | 'sort_order'>;

export type WorkshopWorkingHourView = Pick<
  IWorkshopWorkingHour,
  'day' | 'is_open' | 'opens_at' | 'closes_at'
>;

export type WorkshopAddressView = Omit<
  IWorkshopAddress,
  'id' | 'workshop_id' | 'workshop'
>;

export type WorkshopView = Omit<
  IWorkshop,
  'address' | 'images' | 'documents' | 'working_hours' | 'agreements'
> & {
  address: WorkshopAddressView | null;
  images: WorkshopImageView[];
  /** What the documents screen asks for, from the application's snapshot. */
  document_requirements: WorkshopDocumentRequirementSnapshot[];
  documents: WorkshopDocumentView[];
  working_hours: WorkshopWorkingHourView[];
  /** Whether each agreement is accepted at its current version. */
  agreements: Record<WorkshopAgreementTypeValue, boolean>;
};

export interface IWorkshopApplication {
  id: string;
  workshop_id: string;
  workshop: IWorkshop;
  current_step: WorkshopApplicationStepType;
  status: WorkshopApplicationStatusType;
  phone_no_verified_at: Date | null;
  business_details_completed_at: Date | null;
  shop_location_completed_at: Date | null;
  documents_completed_at: Date | null;
  working_hours_completed_at: Date | null;
  reviewed_at: Date | null;
  agreements_accepted_at: Date | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  /** The active requirements at creation, so later edits never change this application's. */
  document_requirements: WorkshopDocumentRequirementSnapshot[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
