import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(data: string, password: string): string {
  // Generate salt and IV
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)

  // Derive key from password
  const key = scryptSync(password, salt, KEY_LENGTH)

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv)

  // Encrypt data
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get auth tag
  const tag = cipher.getAuthTag()

  // Combine salt + iv + tag + encrypted data
  const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])

  return result.toString('base64')
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, password: string): string {
  // Decode from base64
  const buffer = Buffer.from(encryptedData, 'base64')

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH)
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  )
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

  // Derive key from password
  const key = scryptSync(password, salt, KEY_LENGTH)

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  // Decrypt data
  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Get encryption key from environment or generate default
 */
export function getEncryptionKey(): string {
  return process.env.GENESIS_ENCRYPTION_KEY || 'genesis-default-key-change-in-production'
}
