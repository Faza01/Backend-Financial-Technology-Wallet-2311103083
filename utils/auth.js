const crypto = require('crypto');

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
  saltlen: 16
};

const JWT_SECRET = process.env.JWT_SECRET || 'ganti_dengan_secret_yang_aman';
const JWT_EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS || 3600);

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(SCRYPT_PARAMS.saltlen);
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: 32 * 1024 * 1024
  });

  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('base64url'),
    derivedKey.toString('base64url')
  ].join('$');
}

function verifyPassword(password, storedHash) {
  try {
    const [algorithm, N, r, p, saltRaw, hashRaw] = storedHash.split('$');

    if (algorithm !== 'scrypt') {
      return false;
    }

    const salt = Buffer.from(saltRaw, 'base64url');
    const hashBuffer = Buffer.from(hashRaw, 'base64url');
    const derivedKey = crypto.scryptSync(password, salt, hashBuffer.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: 32 * 1024 * 1024
    });

    return crypto.timingSafeEqual(derivedKey, hashBuffer);
  } catch (error) {
    return false;
  }
}

function signJwt(payload, expiresInSeconds = JWT_EXPIRES_IN_SECONDS) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const finalPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(finalPayload));
  const content = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(content)
    .digest('base64url');

  return `${content}.${signature}`;
}

function verifyJwt(token) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Format token tidak valid.');
  }

  const content = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(content)
    .digest('base64url');

  if (
    encodedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expectedSignature))
  ) {
    throw new Error('Signature token tidak valid.');
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && now >= payload.exp) {
    throw new Error('Token sudah kedaluwarsa.');
  }

  return payload;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  JWT_EXPIRES_IN_SECONDS
};
