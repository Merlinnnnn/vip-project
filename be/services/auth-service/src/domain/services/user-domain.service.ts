import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export class UserDomainService {
  ensureEmailAvailable(existing: User | null, email: string): void {
    if (existing) {
      throw new Error(`Email ${email} is already in use.`);
    }
  }
}
