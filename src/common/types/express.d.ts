import { User } from '@/modules/users/entities/user.entity';
import { Worker } from '@/modules/workers/entities/worker.entity';
import { Workshop } from '@/modules/workshops/entities/workshop.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      worker?: Worker;
      workshop?: Workshop;
    }
  }
}

export {};
