import { Injectable } from '@angular/core';
import {ec as EC} from 'elliptic';
import bs58check from 'bs58check';
import {createHmac, createCipher, createDecipher, randomBytes} from 'crypto';
import {AccessLevel} from '../types/identity';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() {}

  // 32 bytes = 256 bits is plenty of entropy for encryption
  newEncryptionKey(): string {
    return randomBytes(32).toString('hex');
  }

  // TODO we won't need this soon right?
  seedHexEncryptionStorageKey(hostname: string): string {
    return `seed-hex-key-${hostname}`;
  }

  hasSeedHexEncryptionKey(hostname: string): boolean {
    const storageKey = this.seedHexEncryptionStorageKey(hostname);

    return !!localStorage.getItem(storageKey);
  }


  // Place a seed encryption key in storage. If reset is set to true, the
  // previous key is overwritten, which is useful in logging out users.
  seedHexEncryptionKey(hostname: string, reset: boolean = false): string {
    const storageKey = this.seedHexEncryptionStorageKey(hostname);
    let encryptionKey;

    encryptionKey = localStorage.getItem(storageKey) || '';
    if (!encryptionKey || reset) {
      encryptionKey = this.newEncryptionKey();
      localStorage.setItem(storageKey, encryptionKey);
    }

    // If the encryption key is unset or malformed we need to stop
    // everything to avoid returning unencrypted information.
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('Failed to load or generate encryption key; this should never happen');
    }

    return encryptionKey;
  }

  encryptSeedHex(seedHex: string, hostname: string): string {
    const encryptionKey = this.seedHexEncryptionKey(hostname, false);
    const cipher = createCipher('aes-256-gcm', encryptionKey);
    return cipher.update(seedHex).toString('hex');
  }

  decryptSeedHex(encryptedSeedHex: string, hostname: string): string {
    const encryptionKey = this.seedHexEncryptionKey(hostname, false);
    const decipher = createDecipher('aes-256-gcm', encryptionKey);
    return decipher.update(Buffer.from(encryptedSeedHex, 'hex')).toString();
  }

  accessLevelHmac(accessLevel: AccessLevel, seedHex: string): string {
    const hmac = createHmac('sha256', seedHex);
    return hmac.update(accessLevel.toString()).digest().toString('hex');
  }

  validAccessLevelHmac(accessLevel: AccessLevel, seedHex: string, hmac: string): boolean {
    if (!hmac || !seedHex) {
      return false;
    }

    return hmac === this.accessLevelHmac(accessLevel, seedHex);
  }

  // Decode public key base58check to Buffer of secp256k1 public key
  publicKeyToECBuffer(publicKey: string): Buffer {
    // Sanity check similar to Base58CheckDecodePrefix from core/lib/base58.go
    if (publicKey.length < 5){
      throw new Error('Failed to decode public key');
    }
    const decoded = bs58check.decode(publicKey);
    const payload = Uint8Array.from(decoded).slice(3);

    const ec = new EC('secp256k1');
    const publicKeyEC = ec.keyFromPublic(payload, 'array');

    return new Buffer(publicKeyEC.getPublic('array'));
  }

  // TODO check that the signature for the walletStr is valid
  checkSig(walletStr: string, walletSignature: string): boolean {
    throw "implement me"
    return true
  }

  // TODO find errors in the wallet. missing fields, etc. json-schema
  validateWallet(wallet: object): string | null {
    throw "implement me"
    return null
  }
}
