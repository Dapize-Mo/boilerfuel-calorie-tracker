const { TextEncoder, TextDecoder } = require('util');
const { webcrypto } = require('crypto');

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}
if (!global.btoa) {
  global.btoa = str => Buffer.from(str, 'binary').toString('base64');
}
if (!global.atob) {
  global.atob = b64 => Buffer.from(b64, 'base64').toString('binary');
}
