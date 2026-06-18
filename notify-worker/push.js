// Web Push sending using the Web Crypto API — no Node.js dependencies.
// Implements VAPID (draft-thomson-webpush-vapid) and RFC 8291 payload encryption.

const enc = new TextEncoder()

function b64u(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  let bin = ''
  bytes.forEach(b => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromb64u(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

// HKDF-Extract: PRK = HMAC-SHA256(salt, ikm)
async function hkdfExtract(salt, ikm) {
  const k = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, ikm))
}

// HKDF-Expand: OKM = T(1)||T(2)||... truncated to `len` bytes
async function hkdfExpand(prk, info, len) {
  const k = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const out = new Uint8Array(len)
  let t = new Uint8Array(0), pos = 0
  for (let i = 1; pos < len; i++) {
    const block = new Uint8Array(t.length + info.length + 1)
    block.set(t); block.set(info, t.length); block[t.length + info.length] = i
    t = new Uint8Array(await crypto.subtle.sign('HMAC', k, block))
    out.set(t.slice(0, Math.min(t.length, len - pos)), pos)
    pos += t.length
  }
  return out
}

// Build VAPID JWT and return the Authorization header value
async function vapidAuth(privateKeyJwk, publicKeyB64u, endpoint, email) {
  const origin = new URL(endpoint).origin
  const header  = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = b64u(enc.encode(JSON.stringify({
    aud: origin,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: `mailto:${email}`,
  })))
  const toSign = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'jwk', { ...JSON.parse(privateKeyJwk), key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(toSign))
  return `vapid t=${toSign}.${b64u(sig)},k=${publicKeyB64u}`
}

// Encrypt a push payload per RFC 8291 (aes128gcm content encoding)
async function encryptPayload(plaintext, clientP256dhB64u, authB64u) {
  const uaPub    = fromb64u(clientP256dhB64u)  // 65-byte uncompressed point
  const authSec  = fromb64u(authB64u)           // 16-byte auth secret
  const ptBytes  = enc.encode(plaintext)

  // Ephemeral server ECDH key pair
  const serverKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey)) // 65 bytes

  // ECDH shared secret
  const clientKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdhBits  = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKP.privateKey, 256))

  // RFC 8291 §3.4 key derivation
  // PRK_key = HKDF-Extract(salt=authSecret, ikm=ecdhSecret)
  const prkKey = await hkdfExtract(authSec, ecdhBits)

  // IKM = HKDF-Expand(PRK_key, "WebPush: info\x00" || ua_public || as_public, 32)
  const info = new Uint8Array(13 + 1 + uaPub.length + serverPubRaw.length)
  info.set(enc.encode('WebPush: info'))
  info[13] = 0
  info.set(uaPub, 14)
  info.set(serverPubRaw, 14 + uaPub.length)
  const ikm = await hkdfExpand(prkKey, info, 32)

  // Random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // PRK = HKDF-Extract(salt, ikm)
  const prk = await hkdfExtract(salt, ikm)

  // CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\x00", 16)
  const cek   = await hkdfExpand(prk, enc.encode('Content-Encoding: aes128gcm\x00'), 16)
  // nonce = HKDF-Expand(PRK, "Content-Encoding: nonce\x00", 12)
  const nonce = await hkdfExpand(prk, enc.encode('Content-Encoding: nonce\x00'), 12)

  // Pad plaintext: append 0x02 (end-of-record delimiter), no extra padding
  const record = new Uint8Array(ptBytes.length + 1)
  record.set(ptBytes); record[ptBytes.length] = 0x02

  // AES-128-GCM encryption
  const cekKey     = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, record))

  // aes128gcm record: salt(16) | rs(4 BE) | idlen(1) | ciphertext
  const rs = record.length + 16  // record size = plaintext+pad + GCM tag
  const body = new Uint8Array(16 + 4 + 1 + ciphertext.length)
  body.set(salt)
  new DataView(body.buffer).setUint32(16, rs, false)  // big-endian
  body[20] = 0                                         // idlen = 0 (no key id)
  body.set(ciphertext, 21)

  return { body, serverPubB64u: b64u(serverPubRaw) }
}

// Send a web push notification to a single subscription
export async function sendWebPush(subscription, payload, privateKeyJwk, publicKeyB64u, email) {
  const { endpoint, keys } = subscription
  const auth = await vapidAuth(privateKeyJwk, publicKeyB64u, endpoint, email)
  const { body } = await encryptPayload(payload, keys.p256dh, keys.auth)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL: '86400',
    },
    body,
  })

  if (!res.ok && res.status !== 201) {
    const text = await res.text().catch(() => '')
    throw Object.assign(new Error(`Push HTTP ${res.status}`), { status: res.status, body: text })
  }
}
