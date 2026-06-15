export interface JwtPayload {
  sub: string;
  email: string;
  /** Issued at (Unix timestamp) — được jwt.sign() tự điền */
  iat?: number;
  /** Expiry (Unix timestamp) — được jwt.sign() tự điền */
  exp?: number;
}

export type UUID = string;

