import { Injectable } from '@angular/core';
import KeyEncoder from 'key-encoder';
import * as jsonwebtoken from 'jsonwebtoken';
import {CryptoService} from './crypto.service';
import * as sha256 from 'sha256';
import { uvarint64ToBuf } from '../lib/bindata/util';

import * as bip32 from 'bip32';
import { BIP32Interface } from 'bip32'; // TODO: Installed 2.0.6 instead of latest version, only because of weird typescript compilation stuff. Should probably get the latest.
import * as bs58check from 'bs58check'
import * as lbry from 'bitcoinjs-lib' // TODO - package recommends browserify, which I did not do here. This works, but maybe there's good reason to browserify?
import * as ecpair from 'ecpair'; // TODO - required acorn-class-fields for this version of Angular's webpack to accept it. see extend-acorn.js.

const NETWORK = lbry.networks.mainnet

@Injectable({
  providedIn: 'root'
})
export class SigningService {

  constructor(
    private cryptoService: CryptoService,
  ) { }

  // this should be audited and go into a library. hobbled this together from
  // code in bitcoinjs-lib.
  private getAddressFromBip32(node: BIP32Interface): string {
    const hash = lbry.crypto.hash160(node.publicKey)

    const payload = Buffer.allocUnsafe(21);
    payload.writeUInt8(NETWORK.pubKeyHash, 0);
    hash.copy(payload, 1);
    return bs58check.encode(payload);
  }

  getSigningKey(wallet: any, address: string): Buffer | null {
    const account = wallet.accounts
    .filter((account: any) => {
      let node: BIP32Interface = bip32.fromBase58(account.private_key);
      return address === this.getAddressFromBip32(node)
    })[0]
    return bip32.fromBase58(account.private_key).privateKey || null;
  }

  getAddresses(wallet: any): string[] {
    return wallet.accounts
    // won't venture into deterministic yet
    .filter((account: any) => account.address_generator.name === 'single-address')
    .map((account: any) => {
      let node: BIP32Interface = bip32.fromBase58(account.private_key);
      return this.getAddressFromBip32(node)
    })
  }

  signPSBT(psbtHex: string, nonWitnessUtxoHexes: string[], signingKey: Buffer): string {
    const keyPair = ecpair.ECPair.fromPrivateKey(signingKey, { network: NETWORK })
    const nonWitnessUtxos = nonWitnessUtxoHexes.map(h => Buffer.from(h, 'hex'))
    const psbt = lbry.Psbt.fromHex(psbtHex)

    // add all the nonWitnessUtxos, hopefully in the right order
    nonWitnessUtxos.map((nonWitnessUtxo, vout) => {
      psbt.updateInput(vout, { nonWitnessUtxo })
      psbt.signInput(vout, keyPair)
    })

    // WARNING!!!
    // the `true` passed to .extractTransaction(true) means it will ignore unreasonably high fees
    // This is only for ease of debugging because this is a work in progress. This should not go into production.
    // TODO - remove this, put a better "reasonable fee" check into bitcoinjs-lib

    return psbt
      .finalizeAllInputs()
      .extractTransaction(true)
      .toHex()
  }

  signJWT(seedHex: string): string {
    const keyEncoder = new KeyEncoder('secp256k1');
    const encodedPrivateKey = keyEncoder.encodePrivate(seedHex, 'raw', 'pem');
    return jsonwebtoken.sign({ }, encodedPrivateKey, { algorithm: 'ES256', expiresIn: 60 * 10 });
  }

  signAction(seedHex: string, actionHex: string): string {
    // TODO - use bitcoinjs-lib and do an actual signature with the actual key in the wallet, send the identifier of the wallet over, etc etc etc.
    const privateKey = this.cryptoService.seedHexToPrivateKey(seedHex);

    const actionBytes = new Buffer(actionHex, 'hex');
    const actionHash = new Buffer(sha256.x2(actionBytes), 'hex');
    const signature = privateKey.sign(actionHash);
    return new Buffer(signature.toDER()).toString('hex');
  }

  signTransaction(seedHex: string, transactionHex: string): string {
    const privateKey = this.cryptoService.seedHexToPrivateKey(seedHex);

    const transactionBytes = new Buffer(transactionHex, 'hex');
    const transactionHash = new Buffer(sha256.x2(transactionBytes), 'hex');
    const signature = privateKey.sign(transactionHash);
    const signatureBytes = new Buffer(signature.toDER());
    const signatureLength = uvarint64ToBuf(signatureBytes.length);

    const signedTransactionBytes = Buffer.concat([
      // This slice is bad. We need to remove the existing signature length field prior to appending the new one.
      // Once we have frontend transaction construction we won't need to do this.
      transactionBytes.slice(0, -1),
      signatureLength,
      signatureBytes,
    ]);

    return signedTransactionBytes.toString('hex');
  }

}
