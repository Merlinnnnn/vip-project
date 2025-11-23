export class RegisterDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name?: string
  ) {}
}
