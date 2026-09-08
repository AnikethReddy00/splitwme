import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "splitwme-super-secret-jwt-key-2026-xyz";
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Signs a JWT token with the given user payload.
 * @param {object} payload - { id, name, email, upiId }
 * @param {string} expiresIn - Token expiry, e.g. "7d"
 * @returns {Promise<string>}
 */
export async function signToken(payload, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verifies and decodes a JWT token.
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return null;
  }
}
