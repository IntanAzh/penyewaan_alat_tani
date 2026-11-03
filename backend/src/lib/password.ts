import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;

  return ["scrypt-v1", COST, BLOCK_SIZE, PARALLELIZATION, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [version, costValue, blockValue, parallelValue, saltValue, keyValue] = encoded.split("$");
  if (version !== "scrypt-v1" || !saltValue || !keyValue) return false;

  const cost = Number(costValue);
  const blockSize = Number(blockValue);
  const parallelization = Number(parallelValue);
  const expected = Buffer.from(keyValue, "base64url");
  const salt = Buffer.from(saltValue, "base64url");
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelization) || expected.length !== KEY_LENGTH || salt.length !== 16) return false;

  const actual = (await scrypt(password, salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return timingSafeEqual(actual, expected);
}
