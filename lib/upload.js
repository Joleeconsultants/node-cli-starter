import { DIRECT_UPLOAD_LIMIT_BYTES } from './crypto.js'

const DEFAULT_BASE_URL = 'https://bytifi.com'

export class BytifiApiError extends Error {
  constructor(message, { status = 0, body = null } = {}) {
    super(message)
    this.name = 'BytifiApiError'
    this.status = status
    this.body = body
  }
}

export class BytifiNetworkError extends Error {
  constructor(message, { cause } = {}) {
    super(message)
    this.name = 'BytifiNetworkError'
    this.cause = cause
  }
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

async function readResponseBody(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function apiFetch(baseUrl, path, { apiKey, method = 'GET', headers = {}, body = null } = {}) {
  const url = `${normalizeBaseUrl(baseUrl)}${path}`
  const requestHeaders = {
    Authorization: `Bearer ${apiKey}`,
    ...headers,
  }

  let response

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
    })
  } catch (error) {
    throw new BytifiNetworkError(error.message || 'Network request failed.', { cause: error })
  }

  const payload = await readResponseBody(response)

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error
      ? payload.error
      : typeof payload === 'string' && payload
        ? payload
        : `Request failed with status ${response.status}.`
    throw new BytifiApiError(message, { status: response.status, body: payload })
  }

  return payload
}

function buildShareUrl(payload, encryptionToken) {
  return `${payload.url}#token=${encodeURIComponent(encryptionToken)}`
}

function buildResult(payload, encryption, shareUrl) {
  return {
    shareUrl,
    url: payload.url,
    downloadUrl: payload.downloadUrl,
    token: payload.token,
    encryptionToken: encryption.token,
    originalName: payload.originalName || encryption.originalName,
    size: payload.size,
    expiresAt: payload.expiresAt,
    deleteOnDownload: payload.deleteOnDownload,
    clientEncrypted: payload.clientEncrypted,
  }
}

async function uploadDirect(encryption, {
  apiKey,
  baseUrl,
  expiresInMinutes,
  deleteOnDownload,
}) {
  const formData = new FormData()
  const blob = new Blob([encryption.encryptedBuffer], { type: 'application/octet-stream' })

  formData.append('file', blob, encryption.originalName)
  formData.append('clientEncrypted', 'true')
  formData.append('clientEncryptionMeta', JSON.stringify(encryption.meta))
  formData.append('deleteOnDownload', deleteOnDownload ? 'true' : 'false')
  formData.append('expiresInMinutes', String(expiresInMinutes))

  const payload = await apiFetch(baseUrl, '/api/public/upload', {
    apiKey,
    method: 'POST',
    body: formData,
  })

  const shareUrl = buildShareUrl(payload, encryption.token)
  return buildResult(payload, encryption, shareUrl)
}

async function pollUploadStatus(sessionToken, { apiKey, baseUrl, signal }) {
  while (true) {
    if (signal?.aborted) {
      throw new Error('Upload aborted.')
    }

    const payload = await apiFetch(
      baseUrl,
      `/api/public/upload/status?sessionToken=${encodeURIComponent(sessionToken)}`,
      { apiKey },
    )

    if (payload.status !== 'processing') {
      return payload
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}

async function uploadMultipart(encryption, {
  apiKey,
  baseUrl,
  expiresInMinutes,
  deleteOnDownload,
  onProgress,
  signal,
  concurrency = 3,
}) {
  const partSize = encryption.meta.chunkSize + 16
  const initPayload = await apiFetch(baseUrl, '/api/public/upload/init', {
    apiKey,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalName: encryption.originalName,
      mimeType: encryption.mimeType,
      size: encryption.encryptedSize,
      originalSize: encryption.originalSize,
      clientEncrypted: true,
      clientEncryptionMeta: encryption.meta,
      partSize,
      expiresInMinutes,
      deleteOnDownload,
    }),
  })

  const sessionToken = initPayload.sessionToken
  const totalParts = encryption.encryptedParts.length
  let completedParts = 0

  const uploadPart = async (partNumber) => {
    const partBuffer = encryption.encryptedParts[partNumber - 1]
    await apiFetch(
      baseUrl,
      `/api/public/upload/part?sessionToken=${encodeURIComponent(sessionToken)}&partNumber=${partNumber}`,
      {
        apiKey,
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: partBuffer,
      },
    )

    completedParts += 1
    onProgress?.(Math.round((completedParts / totalParts) * 100))
  }

  const queue = Array.from({ length: totalParts }, (_, index) => index + 1)
  const workers = Array.from({ length: Math.min(concurrency, totalParts) }, async () => {
    while (queue.length > 0) {
      if (signal?.aborted) {
        throw new Error('Upload aborted.')
      }

      const partNumber = queue.shift()
      if (!partNumber) return
      await uploadPart(partNumber)
    }
  })

  try {
    await Promise.all(workers)
  } catch (error) {
    await apiFetch(baseUrl, '/api/public/upload/abort', {
      apiKey,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken }),
    }).catch(() => {})

    throw error
  }

  let completePayload = await apiFetch(baseUrl, '/api/public/upload/complete', {
    apiKey,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  })

  if (completePayload.status === 'processing') {
    completePayload = await pollUploadStatus(sessionToken, { apiKey, baseUrl, signal })
  }

  const shareUrl = buildShareUrl(completePayload, encryption.token)
  return buildResult(completePayload, encryption, shareUrl)
}

export async function uploadEncrypted(encryption, options) {
  if (!options?.apiKey) {
    throw new Error('API key is required.')
  }

  if (encryption.encryptedSize <= DIRECT_UPLOAD_LIMIT_BYTES) {
    return uploadDirect(encryption, options)
  }

  return uploadMultipart(encryption, options)
}

export async function uploadFile(filePath, options) {
  const { encryptFile } = await import('./crypto.js')
  const encryption = await encryptFile(filePath, {
    mimeType: options?.mimeType,
  })

  return uploadEncrypted(encryption, options)
}
