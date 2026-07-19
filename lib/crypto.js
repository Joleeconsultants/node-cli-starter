import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fromBase64Url, toBase64Url } from './base64url.js'

export const ENCRYPTED_PART_SIZE = 32 * 1024 * 1024
export const PLAIN_CHUNK_SIZE = ENCRYPTED_PART_SIZE - 16
export const DIRECT_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024

export function buildChunkIv(noncePrefix, chunkIndex) {
  const iv = Buffer.alloc(12)
  noncePrefix.copy(iv, 0, 0, 8)
  iv.writeUInt32BE(chunkIndex, 8)
  return iv
}

export function encryptChunk(plainChunk, key, noncePrefix, chunkIndex) {
  const iv = buildChunkIv(noncePrefix, chunkIndex)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainChunk), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([encrypted, tag])
}

export function createEncryptionToken(tokenBytes = crypto.randomBytes(32)) {
  if (tokenBytes.length !== 32) {
    throw new Error('Encryption token must be 32 bytes.')
  }

  return {
    tokenBytes,
    token: toBase64Url(tokenBytes),
  }
}

export function buildClientEncryptionMeta({
  plainChunkSize,
  chunkCount,
  noncePrefix,
  originalSize,
  mimeType,
}) {
  return {
    version: 1,
    algorithm: 'AES-GCM',
    chunkSize: plainChunkSize,
    chunkCount,
    noncePrefix: toBase64Url(noncePrefix),
    originalSize,
    mimeType: mimeType || 'application/octet-stream',
  }
}

export async function encryptFileBuffer(fileBuffer, {
  originalName = 'upload',
  mimeType = 'application/octet-stream',
  tokenBytes = crypto.randomBytes(32),
  noncePrefix = crypto.randomBytes(8),
  plainChunkSize = PLAIN_CHUNK_SIZE,
} = {}) {
  if (tokenBytes.length !== 32) throw new Error('Encryption token must be 32 bytes.')
  if (noncePrefix.length !== 8) throw new Error('Nonce prefix must be 8 bytes.')

  const key = tokenBytes
  const chunkCount = Math.ceil(fileBuffer.length / plainChunkSize) || 1
  const encryptedParts = []
  let encryptedSize = 0

  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    const start = chunkIndex * plainChunkSize
    const end = Math.min(fileBuffer.length, start + plainChunkSize)
    const plainChunk = fileBuffer.subarray(start, end)
    const encryptedChunk = encryptChunk(plainChunk, key, noncePrefix, chunkIndex)
    encryptedParts.push(encryptedChunk)
    encryptedSize += encryptedChunk.length
  }

  const meta = buildClientEncryptionMeta({
    plainChunkSize,
    chunkCount,
    noncePrefix,
    originalSize: fileBuffer.length,
    mimeType,
  })

  return {
    token: toBase64Url(tokenBytes),
    tokenBytes,
    meta,
    encryptedParts,
    encryptedBuffer: Buffer.concat(encryptedParts),
    encryptedSize,
    originalName,
    mimeType,
    originalSize: fileBuffer.length,
  }
}

export async function encryptFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath)
  const fileBuffer = await fs.readFile(absolutePath)
  const originalName = options.originalName || path.basename(absolutePath)
  const mimeType = options.mimeType || guessMimeType(originalName)

  return encryptFileBuffer(fileBuffer, {
    ...options,
    originalName,
    mimeType,
  })
}

export function decryptChunk(encryptedChunk, tokenBytes, noncePrefix, chunkIndex) {
  if (encryptedChunk.length < 16) {
    throw new Error('Encrypted chunk is too small.')
  }

  const iv = buildChunkIv(noncePrefix, chunkIndex)
  const ciphertext = encryptedChunk.subarray(0, encryptedChunk.length - 16)
  const tag = encryptedChunk.subarray(encryptedChunk.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', tokenBytes, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export function importToken(token) {
  const tokenBytes = fromBase64Url(token)
  if (tokenBytes.length !== 32) {
    throw new Error('Invalid encryption token length.')
  }
  return tokenBytes
}

function guessMimeType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.iso': 'application/octet-stream',
  }
  return map[ext] || 'application/octet-stream'
}
