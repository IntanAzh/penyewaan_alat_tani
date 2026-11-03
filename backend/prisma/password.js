const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return ["scrypt-v1", 16384, 8, 1, salt.toString("base64url"), key.toString("base64url")].join("$");
}

async function verifyPassword(password, encoded) {
  const [version, n, r, p, saltText, keyText] = encoded.split("$");
  if (version !== "scrypt-v1" || !saltText || !keyText) return false;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(keyText, "base64url");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = await scrypt(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
