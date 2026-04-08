import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

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
    
    const authTag = Buffer.from(authTagHex, 'hex');
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt sensitive data.");
  }
}
