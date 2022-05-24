import { Injectable } from '@angular/core';
import {HubService} from './hub.service';
import KeyEncoder from 'key-encoder';
import {GlobalVarsService} from './global-vars.service';
import * as jsonwebtoken from 'jsonwebtoken';
import {PrivateAccountInfo, Network} from '../types/identity';

import * as bip32 from 'bip32';
import { BIP32Interface } from 'bip32'; // TODO: Installed 2.0.6 instead of latest version, only because of weird typescript compilation stuff. Should probably get the latest.
import * as bs58check from 'bs58check'
import * as lbry from 'bitcoinjs-lib' // TODO - package recommends browserify, which I did not do here. This works, but maybe there's good reason to browserify?
import * as ecpair from 'ecpair'; // TODO - required acorn-class-fields for this version of Angular's webpack to accept it. see extend-acorn.js.

// TODO deleteme once I remove the last use of this
const NETWORK = lbry.networks.mainnet

@Injectable({
  providedIn: 'root'
})
export class SigningService {

  constructor(
    private hubService: HubService,
    private globalVars: GlobalVarsService,
  ) { }

  private *generateKeys(
      node: BIP32Interface,
      keyPath: lbry.bip32Lbry.KeyPath
  ): IterableIterator<BIP32Interface> {
    for (let childIndex = 0; ; childIndex++) {
      yield node.derive(keyPath).derive(childIndex)
    }
  }

  // TODO - have a minimum batch size actually, like 10, that's bigger than a
  // gap, to reduce number of requests to the hub. or maybe 5. Get an opinion
  // on what's a common number of used keys. And channels, that may be a
  // different answer.
  // TODO - have a maximum number of keys? Just in case there's a bug so we
  // don't blow up the user's browser?
  private *generateKeyBatches(
      node: BIP32Interface,
      keyPath: lbry.bip32Lbry.KeyPath,
      gap: number,
  ): IterableIterator<BIP32Interface[]> {
    const generatedKeys = this.generateKeys(node, keyPath)
    let batchSize = gap
    while(true) {
      // TODO - confirm gap off-by-one error
      // Get the next `batchSize` keys
      let batchKeys: BIP32Interface[] = []
      for (let index = 0; index < batchSize; index++) {
        batchKeys.push(generatedKeys.next().value)
      }

      // Yield them, and get back the ones that were found to be used
      // TODO - if it's easy for the consumer, we can just accept the last one,
      //   or even better, its index within `batchKeys`
      const usedBatchKeys = yield batchKeys
      if (usedBatchKeys === undefined) {
        throw "generateKeyBatches iteration needs an array of used batch keys"
      }

      // If none are used, we passed the gap and found nothing
      if (usedBatchKeys.length === 0) return

      // Easier for finding
      const batchPubKeys = batchKeys.map(key => key.public_key)
      const usedBatchPubKeys = usedBatchKeys.map(key => key.public_key)

      // What is the last index of batchPubKeys (and thus batchKeys) that is in
      // usedBatchPubKeys?
      const lastUsedIndex = Math.max.apply(
        Math, usedBatchPubKeys.map(pubKey => batchPubKeys.indexOf(pubKey))
      )

      // Indicates a bug here, or `usedBatchKeys` failed to be a subset of
      //   `batchKeys`.
      if (lastUsedIndex === -1) throw "error determining next batch"

      // TODO think about if this is right. Maybe needs test cases.

      // Now that we know what the last used key is in our batch, we want to
      // have enough keys after it to cover the next gap.

      // Any keys in our current batch after the last used key is the beginning
      // of the next gap.
      const gapInThisBatch = batchSize - (lastUsedIndex + 1)

      // The rest of the next gap will be the at the beginning of the next
      // batch. We'll make our batch big enough to contain it, in case it's
      // full size.
      batchSize = gap - gapInThisBatch;
    }
  }

  /*
  Example claim. Just so I know the format while I'm working on this. Delete
  after channel retrieval work is done.

  {
    "address": "bbvk6TMEzujW8r3xhP6e1FhCuSW3FYP9SJ",
    "amount": "0.01",
    "claim_id": "7d39c627771c529e65656f4ca86d13686acc0442",
    "claim_op": "create",
    "confirmations": 193,
    "has_signing_key": true,
    "height": 1157989,
    "is_internal_transfer": false,
    "is_my_input": true,
    "is_my_output": true,
    "is_spent": false,
    "meta": {},
    "name": "@lolstupidtest2",
    "normalized_name": "@lolstupidtest2",
    "nout": 0,
    "permanent_url": "lbry://@lolstupidtest2#7d39c627771c529e65656f4ca86d13686acc0442",
    "timestamp": 1652278858,
    "txid": "a62878d9c558cd17f1f946df03aa8584dd002238004a02d742261b5c560dc43f",
    "type": "claim",
    "value": {
      "public_key": "023bfe202119244b448f8974ee3152a3d859ac169a420b8ef1dda423fa015b2a4f",
      "public_key_id": "bUfKnUamA7T3S2JGjV6Rmb8o3Wtn79WSTA"
    },
    "value_type": "channel"
  }
  */

  // TODO error handling?
  // TODO - deprecated channel key (`certificates` field)
  private getChannelsForAccount(account: PrivateAccountInfo): Observable<PrivateChannelInfo[]> {
    // TODO Can single addresses register channels?
    // Grin says yes.
    // If so, handle single key cases. For generated key cases, assert that
    // it === "deterministic-chain" (there shouldn't be anything else), or make
    // a note to validate the wallet via jsonschema when reading it initially.

    // TODO - there's got to be a better way.
    return new Observable(subscriber => {
      const keyBatches = this.generateKeyBatches(
        this.bip32FromAccount(account),
        lbry.bip32Lbry.KeyPath.CHANNEL,
        1, // TODO what gap do I actually use for channels?
      )

      // Where we accumulate all of the channels we find through all of the
      // recursions
      let foundChannels: PrivateChannelInfo[] = []

      accumulateChannels(possibleKeys: BIP32Interface[], done: boolean) {
        if (done) {
          // The address generator has indicated that all used channel keys
          // have been found. Give the subscriber all of the channels we just
          // accumulated across recursions.
          subscriber.next(foundChannels)
          subscriber.complete()
          return
        }
        possibleKeysByKeyId = Object.fromEntries(
          possibleKeys.map(key => [this.getAddressFromBip32(key, account.network), key])
        )
        this.hubService.findChannels(
          possibleKeys.map(key => this.getAddressFromBip32(key, account.network))
        ).pipe(
          map(res => {
            // TODO - Should expect HUB to return revoked channels as well.
            // Theose need to be added to `usedKeys` since they count toward
            // gaps.
            const newChannels: PrivateChannelInfo[] = res.map(hubChannel => ({
              claimId: hubChannel.claim_id,
              name: hubChannel.name,
              normalizedName: hubChannel.normalizedName,
              pubKeyId: hubChannel.value.public_key_id,
              signingKey: possibleKeysByKeyId[hubChannel.value.public_key_id],
              // TODO - more fields?
            }))

            foundChannels = foundChannels.concat(newChannels)

            const usedKeys = newChannels.map(channel => possibleKeysByKeyId[channel.pubKeyId])

            // Give the address generator `usedKeys` so it knows how many to grab
            // next, to cover the gap we're looking for
            ({value: possibleKeys, done} = keyBatches.next(usedKeys));

            accumulateChannels(possibleKeys, done)
          })
        )
      }

      (const {value: possibleKeys, done} = keyBatches.next());
      accumulateChannels(possibleKeys, done)
    })
  }

  /*
    The functions below in the commented out block are an earlier layer of WIP
    than the rest of it. At that point, we thought we needed to get all of the
    used addresses and use them to get the channel claims. (Whereas the newer 
    plan would be to use special hub endpoints to get the channel info more
    directly.)

    That said, we will eventually probably have use for some of this stuff.
    Primarily, we'll need to find spending keys. But who knows, maybe we'll
    even change plans back again wrt Channel querying. I was afraid of deleting
    it until we had something working.
    
    It didn't get completed (or so I recall?) before we switched gears so it's
    commented out. (Not that the newer plan work is completed either!)

    Even if we use some or all of this, we should probably reimplement it using
    `generateKeyBatches` (from the newer plan's code), because it's just
    cleaner.
  */

  /*
  // Add all of the keys I can find from a private key
  // `channelAddresses` should be all channel addresses, from both active and
  // revoked claims. This helps us avoid issues with key generation gaps.
  private findChannelKeysForAccount(
      node: BIP32Interface,
      claimChannelAddresses: string[],
      deprecatedChannelKeys: {string: string}
  ): {[key: string]: BIP32Interface}
  {
    let numRemainingKeys = claimChannelAddresses.length
    const channelKeys: {[key: string]: BIP32Interface} = {}
    for (const channelAddress in deprecatedChannelKeys) {
      if (channelAddress in claimChannelAddresses) {
        // TODO - Implement getting deprecated channel private keys from pem
        // format to bip32, somehow.
        // channelKeys[channelAddress] = this.fromPem(deprecatedChannelKeys[channelAddress])
        numRemainingKeys--;
      }
    }
    const generatedChannelKeys = this.generateKeys(node, lbry.bip32Lbry.KeyPath.CHANNEL)
    let numRemainingSkippedKeys = 10
    while(numRemainingSkippedKeys>0) {
      const channelKey = generatedChannelKeys.next().value
      const channelAddress = this.getAddressFromBip32(channelKey, channelKey.network)
      if (channelAddress in claimChannelAddresses) {
        channelKeys[channelAddress] = channelKey
        numRemainingKeys--;
      } else {
        // TODO - should this ever happen? How many should there be? Should this use the normal "gap system"?
        numRemainingSkippedKeys--;
      }
    }
    return channelKeys;
  }

  // TODO - Respect address use maximum, here, or wherever is relevant.
  private getUsedAddresses(account: PrivateAccountInfo): {[key in lbry.bip32Lbry.KeyPath]: string[]} {
    if (account.address_generator.name == "single-address") {
      // TODO is this right? Can single addresses register channels?
      const accountId = this.getAddress(account)
      // TODO - actually not quite a "used" address either. May not have been
      // used, but we should search for channels with it. So what is the right
      // name?
      return {RECEIVE: [accountId]} // and not have CHANGE
    }

    // If it is not this, something is amiss.
    // TODO - actually just put this in the wallet json schema
    if(account.address_generator.name !== "deterministic-chain") {
      throw "Expected deterministic-chain at this point"
    }

    const result = {}
    for (let keyPath of [lbry.bip32Lbry.KeyPath.CHANGE, lbry.bip32Lbry.KeyPath.RECEIVE]) {
      const keyBatches = this.generateKeyBatches(
        this.bip32FromAccount(account),
        keyPath,
        account.address_generator.change.gap,
      )

      let usedAddresses: string[] = []
      let possibleKeys;
      let done = false;
      ({value: possibleKeys, done} = keyBatches.next());
      while (!done) {
        const nextUsedAddresses = this.hubService.doIHaveHistory(
          possibleKeys.map(key => this.getAddressFromBip32(key, key.network))
        )
        usedAddresses = usedAddresses.concat(nextUsedAddresses)
        keyBatches.next(nextUsedAddresses)
      }
      result[keyPath] = usedAddresses
    }
    return result
  }

  // Query the hub for all our used addresses. Note which account they came
  // from.
  // return: {usedAddress: accountId}
  private getAccountIDsByUsedAddress(accounts: PrivateAccountInfo[]): {[key: string]: string} {
    // accountIDsByUsedAddress: {usedAddress: accountId}
    const accountIDsByUsedAddress: {[key: string]: string} = {}

    for (let account of accounts) {
      // TODO - this.getUsedAddresses returns the addresses by keypath now
      for (let usedAddress of this.getUsedAddresses(account)) {
        accountIDsByUsedAddress[usedAddress] = this.getAddress(account)
      }
    }
  }

  // Query the hub for all our channel claims, based on used keys. Organize The
  // channels by accountId.
  // returns channelsByAccountId: {accountId: channelClaims[]}
  public getChannelsByAccountId(accounts: PrivateAccountInfo[]): {[key: string]: any}{
    const accountIDsByUsedAddress = this.getAccountIDsByUsedAddress(accounts)
    const channelsByAccountId = {}

    for (let claim of this.hubService.getClaims(Object.keys(accountIDsByUsedAddress))) {
      if (claim.value_type != 'channel') {
        continue
      }
      const accountId = accountIDsByUsedAddress[claim.address]
      if(!accountId) {
        // Don't trust what comes from the hub
        // TODO - trust fewer things?
        throw "bad accountId"
      }
      if (!channelsByAccountId[claim.address]) {
        channelsByAccountId[claim.address] = []
      }
      channelsByAccountId[accountId].push(claim)
    }

    return channelsByAccountId
  }

  // Figure out channel private keys for the channel addresses, for each
  // account.
  // returns {accountId: {channelAddress: channelPrivateKey}}
  public getChannelKeysByAccountId(accounts, channelsByAccountId): {[key: string]: {[key: string]: string}} {
    const channelKeysForAccount: {[key: string]: {[key: string]: string}} = {}
    for (const account of accounts) {
      const accountId = this.getAddress(account)
      channelKeysForAccount[accountId] = this.findChannelKeysForAccount(
        this.bip32FromAccount(account),
        channelsByAccountId[accountId].map(claim => claim.value.public_key_id),
        account.certificates,
      )
    }
    return channelKeysForAccount
  }
  */

  private bip32FromAccount(account: PrivateAccountInfo): BIP32Interface {
    const network = {
      'lbc_mainnet': lbry.networks.mainnet,
      'lbc_testnet': lbry.networks.testnet,
      'lbc_regtest': lbry.networks.regtest,
    }[account.ledger]
    return bip32.fromBase58(account.private_key, network);
  }

  // TODO - make sure this comes up with the right account ID!
  public getAddress(accountKey: string, accountNetwork: Network): string {
    const network = {
      'lbc_mainnet': lbry.networks.mainnet,
      'lbc_testnet': lbry.networks.testnet,
      'lbc_regtest': lbry.networks.regtest,
    }[accountNetwork]
    let node: BIP32Interface = bip32.fromBase58(accountKey, network);
    return this.getAddressFromBip32(node, network)
  }

  private getAddressFromBip32(node: BIP32Interface, network: lbry.networks.Network): string {
    // taken from a test in bitcoinjs-lib
    return lbry.payments.p2pkh({ pubkey: node.publicKey, network }).address!;
  }

  // TODO - Note to future self - I think this may be a function we only needed
  // for the demo (like getSpendingAddresses). Or maybe it just needs to be
  // updated for real use.
  getSigningKey(wallet: any, address: string): Buffer | null {
    const account = wallet.accounts
    .filter((account: any) => {
      return address === this.getAddress(account)
    })[0]
    return bip32.fromBase58(account.private_key, network).privateKey || null;
  }

  // Does this belong in identity.service next to getChannels? or does
  // getChannels belong here next to this?
  // TODO - This is outdated, but make sure there's not something I need to
  //   extract from here before deleting it.
  /*
  private getSpendingAddresses(wallet: any): string[] {
    return wallet.accounts
    // won't venture into deterministic yet
    .filter((account: any) => account.address_generator.name === 'single-address')
    .map((account: any) => this.getAddress(account))
    )
  }
  */

  signPSBT(psbtHex: string, nonWitnessUtxoHexes: string[], signingKey: Buffer): string {
    // TODO Don't use this.globalVars.network here, use the network specified
    // in the relevant account.ledger (assuming we even really need network)
    const keyPair = ecpair.ECPair.fromPrivateKey(signingKey, { network: this.globalVars.network })
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
    return ""

    // TODO - use bitcoinjs-lib and do an actual signature with the actual key in the wallet, send the identifier of the wallet over, etc etc etc.
    // Assuming we want to keep this

    const keyEncoder = new KeyEncoder('secp256k1');
    const encodedPrivateKey = keyEncoder.encodePrivate(seedHex, 'raw', 'pem');
    return jsonwebtoken.sign({ }, encodedPrivateKey, { algorithm: 'ES256', expiresIn: 60 * 10 });
  }

  signAction(seedHex: string, actionHex: string): string {
    return ""

    // TODO - use bitcoinjs-lib and do an actual signature with the actual key in the wallet, send the identifier of the wallet over, etc etc etc.

    /*
    const privateKey = this.cryptoService.seedHexToPrivateKey(seedHex);

    const actionBytes = new Buffer(actionHex, 'hex');
    const actionHash = new Buffer(sha256.x2(actionBytes), 'hex');
    const signature = privateKey.sign(actionHash);
    return new Buffer(signature.toDER()).toString('hex');
    */
  }

}
