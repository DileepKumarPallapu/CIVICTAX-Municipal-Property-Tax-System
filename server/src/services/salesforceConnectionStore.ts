
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

import { config } from '../config/index.js';
import type { SalesforceSessionData } from '../types/index.js';
import { getRedisClient } from './redisClient.js';

const KEY = 'civictax:salesforce:central';
const TTL_SECONDS = 60 * 60 * 24 * 30;

if (!config.sessionSecret || config.sessionSecret.length < 16) {
  throw new Error(
    'A valid SESSION_SECRET is required for Salesforce token encryption.'
  );
}

// Derive a 256-bit encryption key from the server secret.
const encryptionKey = scryptSync(
  config.sessionSecret,
  'civictax-salesforce-v1',
  32
);

function getConfiguredRedisClient() {
  const client = getRedisClient();
  if (!client) {
    throw new Error('Redis is not configured for Salesforce credential storage.');
  }
  return client;
}

// ============================================================
// ENCRYPTION
// ============================================================

function encrypt(data: SalesforceSessionData): string {
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    'aes-256-gcm',
    encryptionKey,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
}

// ============================================================
// DECRYPTION
// ============================================================

function decrypt(value: string): SalesforceSessionData {
  const parts = value.split('.');

  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error('Invalid encrypted Salesforce connection format.');
  }

  const [ivText, tagText, encryptedText] = parts;

  const iv = Buffer.from(ivText, 'base64');
  const authTag = Buffer.from(tagText, 'base64');
  const encryptedData = Buffer.from(encryptedText, 'base64');

  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error('Invalid Salesforce encryption parameters.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  const parsed: unknown = JSON.parse(decrypted.toString('utf8'));

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('accessToken' in parsed) ||
    !('instanceUrl' in parsed)
  ) {
    throw new Error('Invalid Salesforce session data.');
  }

  return parsed as SalesforceSessionData;
}

// ============================================================
// CENTRAL SALESFORCE CONNECTION STORE
// ============================================================

export const SalesforceConnectionStore = {
  // Save encrypted Salesforce credentials.
  async save(data: SalesforceSessionData): Promise<void> {
    if (!data.accessToken || !data.instanceUrl) {
      throw new Error(
        'Cannot save Salesforce connection without an access token and instance URL.'
      );
    }

    const encryptedData = encrypt(data);

    await getConfiguredRedisClient().set(KEY, encryptedData, TTL_SECONDS);
  },

  // Retrieve and decrypt the central Salesforce connection.
  async get(): Promise<SalesforceSessionData | null> {
    const encryptedData = await getConfiguredRedisClient().get(KEY);

    if (!encryptedData) {
      return null;
    }

    try {
      return decrypt(encryptedData);
    } catch {
      console.error(
        'Unable to decrypt the stored Salesforce connection.'
      );

      throw new Error(
        'Stored Salesforce connection could not be decrypted. Check SESSION_SECRET.'
      );
    }
  },

  // Remove the central Salesforce connection.
  async disconnect(): Promise<void> {
    await getConfiguredRedisClient().del(KEY);
  },

  // Check whether a central connection exists.
  async isConnected(): Promise<boolean> {
    return getConfiguredRedisClient().exists(KEY);
  },
};
