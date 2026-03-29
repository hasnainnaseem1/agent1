/**
 * Key Pool Service
 * 
 * Manages weighted round-robin Etsy API key rotation.
 * Selects the least-used active key, handles rate-limit cooldowns,
 * and auto-disables keys after repeated failures.
 * 
 * Usage:
 *   const { getNextKey, handleRateLimit, handleKeyError } = require('../../services/etsy/keyPoolService');
 * 
 *   const key = await getNextKey();
 *   // key = { _id, apiKey (encrypted), sharedSecret (encrypted), label }
 * 
 *   // On 429 from Etsy:
 *   await handleRateLimit(key._id, retryAfterSeconds);
 * 
 *   // On error:
 *   await handleKeyError(key._id, 'Connection refused');
 */

const { EtsyApiKey } = require('../../models/integrations');
const { decrypt } = require('../../utils/encryption');
const log = require('../../utils/logger')('KeyPool');

/**
 * Get the next available API key from the pool (least-used first).
 * Decrypts apiKey and sharedSecret before returning.
 * 
 * @returns {Object} { _id, label, apiKey, sharedSecret } with plaintext credentials
 * @throws {Error} If no active keys are available in the pool
 */
const getNextKey = async () => {
  const keys = await EtsyApiKey.getAvailableKeys();

  if (!keys || keys.length === 0) {
    // Fallback to environment variables (same keys used by OAuth/shop connect)
    const envKey = process.env.ETSY_CLIENT_ID || process.env.ETSY_API_KEY;
    const envSecret = process.env.ETSY_CLIENT_SECRET || process.env.ETSY_SHARED_SECRET;

    if (envKey) {
      log.warn('No keys in EtsyApiKey collection — falling back to env ETSY_CLIENT_ID');
      return {
        _id: null,
        label: 'env-fallback',
        apiKey: envKey,
        sharedSecret: envSecret || ''
      };
    }

    log.error('No active API keys available in the pool AND no ETSY_CLIENT_ID in env');
    throw new Error('No active API keys available in the pool');
  }

  // First key has the lowest requestCount24h (weighted round-robin)
  const selected = keys[0];
  log.info(`Selected key: label="${selected.label}" _id=${selected._id} dailyUsage=${selected.requestCount24h || 0} errorCount=${selected.errorCount || 0}`);

  // Record usage on the original document (getAvailableKeys returns lean docs)
  await EtsyApiKey.findByIdAndUpdate(selected._id, {
    $inc: { requestCount24h: 1 },
    $set: { lastUsedAt: new Date(), errorCount: 0 }
  });

  // apiKey is stored as plaintext in DB; only sharedSecret is encrypted
  const decryptedSecret = decrypt(selected.sharedSecret);
  log.info(`Key decrypted OK: label="${selected.label}" keyPrefix=${selected.apiKey?.substring(0, 8)}...`);

  return {
    _id: selected._id,
    label: selected.label,
    apiKey: selected.apiKey,
    sharedSecret: decryptedSecret
  };
};

/**
 * Mark a key as rate-limited with a cooldown period.
 * 
 * @param {string} keyId - The _id of the EtsyApiKey document
 * @param {number} retryAfterSeconds - Seconds until the key can be used again
 */
const handleRateLimit = async (keyId, retryAfterSeconds = 60) => {
  if (!keyId) return; // env fallback key, nothing to update
  log.warn(`Rate-limiting key ${keyId} — cooldown ${retryAfterSeconds}s`);
  const key = await EtsyApiKey.findById(keyId);
  if (key) {
    await key.markRateLimited(retryAfterSeconds);
  }
};

/**
 * Record an error against a key. Auto-disables after 3 consecutive errors.
 * 
 * @param {string} keyId - The _id of the EtsyApiKey document
 * @param {string} errorMessage - Description of the error
 */
const handleKeyError = async (keyId, errorMessage) => {
  if (!keyId) return; // env fallback key, nothing to update
  log.warn(`Key error on ${keyId}: ${errorMessage}`);
  const key = await EtsyApiKey.findById(keyId);
  if (key) {
    await key.recordError(errorMessage);
    if (key.errorCount >= 2) {
      log.error(`Key ${keyId} (label=${key.label}) has ${key.errorCount + 1} errors — may be auto-disabled`);
    }
  }
};

module.exports = { getNextKey, handleRateLimit, handleKeyError };
