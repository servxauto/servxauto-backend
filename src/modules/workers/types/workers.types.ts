export interface IWorker {
  id: string;
  phone_no: string;
  email: string | null;
  name: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
