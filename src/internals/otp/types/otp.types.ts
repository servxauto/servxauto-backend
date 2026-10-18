export interface IOtp {
  id: string;
  code: number;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
