export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string | null,
    public passwordHash: string,
    public readonly createdAt: Date = new Date(),
    public refreshToken?: string | null,
    public refreshTokenExpiresAt?: Date | null
  ) {}
}
