import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

/**
 * Encrypts a string using a master key.
 * @param text The string to encrypt (e.g., Solana Private Key)
 * @param masterKey A 32-byte hex string from Infisical
 * @returns An encrypted string in the format "iv:encrypted:authTag"
 */
export function encrypt(text: string, masterKey: string) {
  try {
    const iv = crypto.randomBytes(12);
    // masterKey should be 32 bytes for aes-256-gcm
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(masterKey, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to secure sensitive data.");
  }
}

/**
 * Decrypts a string previously encrypted with encrypt()
 * @param encryptedData The string in "iv:encrypted:authTag" format
 * @param masterKey A 32-byte hex string from Infisical
 */
export function decrypt(encryptedData: string, masterKey: string) {
  try {
    const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
    if (!ivHex || !encrypted || !authTagHex) {
        throw new Error("Invalid encrypted data format.");
    }
    
    const decipher = crypto.createDecipheriv(
      algorithm, 
      Buffer.from(masterKey, 'hex'), 
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt sensitive data. This usually means the Master Key is incorrect.");
  }
}
