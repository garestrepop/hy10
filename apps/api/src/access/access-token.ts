import { createHmac, timingSafeEqual } from 'crypto';

export type AccessRole = 'admin' | 'staff';

export interface AccessPrincipal {
  id: string;
  role: AccessRole;
  email?: string;
}

interface AccessTokenClaims {
  sub: string;
  role: AccessRole;
  email?: string;
  iat: number;
  exp: number;
}

const ACCESS_TTL_SECONDS = 15 * 60;

export function signAccessToken(
  principal: AccessPrincipal,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims: AccessTokenClaims = {
    sub: principal.id,
    role: principal.role,
    email: principal.email,
    iat: nowSeconds,
    exp: nowSeconds + ACCESS_TTL_SECONDS,
  };
  const payload = base64Url(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

export function verifyAccessToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): AccessPrincipal {
  const parts = token.split('.');
  if (parts.length !== 3 || !secret) {
    throw new Error('invalid access token');
  }

  const [header, payload, signature] = parts;
  const signingInput = `${header}.${payload}`;
  const expected = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('invalid access token');
  }

  const claims = JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf8'),
  ) as Partial<AccessTokenClaims>;

  if (
    typeof claims.exp !== 'number' ||
    claims.exp <= nowSeconds ||
    typeof claims.sub !== 'string' ||
    claims.sub.length === 0 ||
    (claims.role !== 'admin' && claims.role !== 'staff')
  ) {
    throw new Error('invalid access token');
  }

  return {
    id: claims.sub,
    role: claims.role,
    email: typeof claims.email === 'string' ? claims.email : undefined,
  };
}

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}
