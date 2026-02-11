import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '../../src/wallet/encryption.js'

describe('Encryption', () => {
  const password = 'test-password-123'

  it('should encrypt and decrypt data correctly', () => {
    const originalData = 'sensitive-private-key-data'
    const encrypted = encrypt(originalData, password)
    const decrypted = decrypt(encrypted, password)

    expect(decrypted).toBe(originalData)
    expect(encrypted).not.toBe(originalData)
  })

  it('should produce different ciphertext for same data', () => {
    const data = 'test-data'
    const encrypted1 = encrypt(data, password)
    const encrypted2 = encrypt(data, password)

    // Should be different due to random IV and salt
    expect(encrypted1).not.toBe(encrypted2)

    // But both should decrypt to same value
    expect(decrypt(encrypted1, password)).toBe(data)
    expect(decrypt(encrypted2, password)).toBe(data)
  })

  it('should fail with wrong password', () => {
    const data = 'secret-data'
    const encrypted = encrypt(data, password)

    expect(() => {
      decrypt(encrypted, 'wrong-password')
    }).toThrow()
  })

  it('should handle empty strings', () => {
    const data = ''
    const encrypted = encrypt(data, password)
    const decrypted = decrypt(encrypted, password)

    expect(decrypted).toBe(data)
  })

  it('should handle long strings', () => {
    const data = 'a'.repeat(10000)
    const encrypted = encrypt(data, password)
    const decrypted = decrypt(encrypted, password)

    expect(decrypted).toBe(data)
  })
})
