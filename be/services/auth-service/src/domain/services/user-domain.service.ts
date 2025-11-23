import { User } from '../entities/user.entity';

export class UserDomainService {
  ensureEmailAvailable(existing: User | null, email: string): void {
    if (existing) {
      throw new Error(`Email ${email} is already in use.`);
    }
  }
}
