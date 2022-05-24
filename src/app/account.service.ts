import {Injectable} from '@angular/core';
import {GlobalVarsService} from './global-vars.service';
import {HubService} from './hub.service';
import {SigningService} from './signing.service';
import {
  AccessLevel,
  ActionType,
  PrivateAccountInfo,
  PrivateChannelInfo,
  PublicChannelInfo,
} from '../types/identity';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private static walletStorageKey = 'wallet';
  private static channelsStorageKey = 'channels';
  private static accessStorageKey = 'access';

  constructor(
    private globalVars: GlobalVarsService,
    private signingService: SigningService,
  ) { }

  /*

  What we're keeping in local storage. TODO - make these into data structs.

  // The wallet, taken from wallet Sync. Perhaps even with local changes to be
  // pushed back to sync.
  localStorage["wallet"] = {
    // We may later want to add signature, sync metadata, etc. Or maybe we want
    // the strict string representation that came out of sync.
    walletStoreVersion: 0,

    wallet: "...",
  }

  // Access information. For each hostname, what channel is logged in, and what
  // level of permission for various actions did the user give?
  localStorage["access"] = {
    // There can be multiple hostnames
    "<hostnames>": { // TODO - type Hostname
      "currentChannel": "<channel-claim-id>", // TODO - type ChannelClaimID
      "levels": {
        // There can be multiple channels
        "<channel-claim-ids>": {
          // There can be multiple action types
          "<action-types>": "<level>",
        }
      }
    }
  }

  localStorage["channels"] = {
    // There can be multiple channels
    "<channels>": PrivateChannelInfo,
  }
  */

  private hasWallet(): boolean {
    return !!localStorage.getItem(AccountService.walletStorageKey);
  }

  // TODO define a wallet type, and/or use a type defined by json-schema
  public getWallet(): {accounts: [PrivateAccountInfo]} | null {
    const walletStoreStr = localStorage.getItem(AccountService.walletStorageKey);
    const walletStore = JSON.parse(walletStoreStr || 'null')
    if (walletStore !== null) {
      if (walletStore.walletStoreVersion === 0) {
        return walletStore.wallet
      }
    }
    return null
  }

  private putWallet(wallet: object | null) {
    const walletStore = {
      // We may later want to add signature, sync metadata, etc. Or maybe we
      // want the strict string representation that came out of sync. This is
      // not the version of the wallet's internal structure; that has its own
      // version key
      walletStoreVersion: 0,

      wallet
    }
    localStorage.setItem(AccountService.walletStorageKey, JSON.stringify(walletStore));
  }

  // TODO - PrivateAccountInfo should just contain a bip32 node and an
  // "address" (account ID) that it generates when reading from storage. It
  // wouldn't write these values back to storage, they're a function of the
  // data already there. It would clean up the code by removing the need for
  // bip32FromAccount, getAddress, and getAddressFromBip32.
  public getAccounts(): PrivateAccountInfo[] {
    const wallet = this.getWallet()
    if (wallet === null) {
      return []
    }
    const filteredAccounts: PrivateAccountInfo[] = [];

    for (const account of wallet.accounts) {
      // Only include accounts from the current network
      if (account.ledger !== this.globalVars.network) {
        continue;
      }

      filteredAccounts.push(account);
    }
    return filteredAccounts
  }

  private clearChannels() {
    localStorage.setItem(AccountService.channelsStorageKey, JSON.stringify(null));
  }

  // TODO - This function is async due to the http call, so now I have to
  // rethink the guarantees about login state being based on the data being in
  // localStorage.
  //
  // TODO error handling?
  public updateChannels(): Observable<null> {
    // Where we accumulate the channels for all accounts through all of the
    // recursions
    let channels: {[key: string]: {[key: string]: PrivateChannelInfo}} = {};

    // Return this so the caller can do something pending this completing
    // (perhaps keep the login state orderly)
    // TODO - there's got to be a better way.
    return new Observable(subscriber => {
      accumulateChannelsForAccounts(accounts: PrivateAccountInfo[]) {
        if(!accounts.length){
          // We got the channels for all accounts. Give it to the subscriber so we can add it to local storage.
          subscriber.next(channels)
          subscriber.complete()
          return
        }
        this.signingService.getChannelsForAccount(accounts[0])
        .pipe(
          map(acountChannels => {
            const accountId = this.signingService.getAddress(account)
            // `acountChannels` is an array. We want the same data in an object,
            // keyed by the pubKey field. 
            channelsByPubkey = Object.fromEntries(
              acountChannels.map(channel => [channel.pubKeyId, channel])
            )
            channels[accountId] = channelsByPubkey

            // Call again, omitting the account we just handled.
            accumulateChannelsForAccount(accounts.slice(1))
          })
        )
      }

      // Kick it off with all accounts.
      accumulateChannelsForAccounts(this.getAccounts())
    }).pipe(
      map(channels => {
        localStorage.setItem(AccountService.channelsStorageKey, JSON.stringify(channels));
        return null
      })
    ).subscribe() // We want to actually kick off these actions if this function is called (see pipe vs subscribe)
  }

  public hasChannels() {
    return !!localStorage.getItem(AccountService.channelsStorageKey);
  }

  public getChannelsPrivate(): {[key: string]: PrivateChannelInfo} {
    return JSON.parse(localStorage.getItem(AccountService.channelsStorageKey) || '{}');
  }

  // returns {accountId: [PublicChannelInfo]}
  public getChannelsPublic(): {[key: string]: PublicChannelInfo} {
    const privateChannels: {[key: string]: PrivateChannelInfo} = this.getChannelsPrivate()
    const publicChannels: {[key: string]: PublicChannelInfo} = {}
    for(const accountId of Object.keys(privateChannels)) {
      publicChannels[accountId] = {
        claimId: privateChannels[accountId].claimId,
        name: privateChannels[accountId].name,
        normalizedName: privateChannels[accountId].normalizedName,
        pubKeyId: privateChannels[accountId].pubKeyId,
      }
    }
    return publicChannels
  }

  private clearAccess() {
    localStorage.setItem(AccountService.channelsStorageKey, JSON.stringify(null));
  }

  private initAccess() {
    // no currentChannel or access level for any action on any hostname
    localStorage.setItem(AccountService.accessStorageKey, '{}');
  }

  public hasAccess() {
    return !!localStorage.getItem(AccountService.accessStorageKey);
  }

  public getActiveChannel(hostname: string): PublicChannelInfo | null {
    // TODO - and actually, this maybe only needs to happen on startup. could save in a local variable.
    const channels = this.getChannelsPublic()
    const access = JSON.parse(localStorage.getItem(AccountService.accessStorageKey) || '{}');

    if (access[hostname]) {
      const activeChannelClaimId = access[hostname].currentChannel
      return channels[activeChannelClaimId]
    }
    return null
  }

  public getActiveChannelAccessLevel(hostname: string, action: ActionType): AccessLevel {
    const access = JSON.parse(localStorage.getItem(AccountService.accessStorageKey) || '{}');

    if (!access[hostname]) {
      return AccessLevel.None
    }
    const activeChannelClaimId = access[hostname].currentChannel
    if (!access[hostname].levels[activeChannelClaimId]) {
      return AccessLevel.None
    }

    const accessLevel = access[hostname].levels[activeChannelClaimId][action]

    if (Object.values(AccessLevel).includes(accessLevel)) {
      return accessLevel;
    } else {
      return AccessLevel.None;
    }
  }

  public setAccessLevel(hostname: string, channelClaimId: string, action: ActionType, level: AccessLevel) {
    const access = JSON.parse(localStorage.getItem(AccountService.accessStorageKey) || '{}');
    if (!(hostname in access)) {
      access[hostname] = {levels: {}}
    }
    if (!(channelClaimId in access[hostname].levels)) {
      access[hostname].levels[channelClaimId] = {}
    }
    access[hostname].levels[channelClaimId][action] = level
    localStorage.setItem(AccountService.accessStorageKey, JSON.stringify(access));
  }

  public setAccessCurrentChannel(hostname: string, channelClaimId: string) {
    const access = JSON.parse(localStorage.getItem(AccountService.accessStorageKey) || '{}');
    if (!(hostname in access)) {
      access[hostname] = {levels: {}}
    }
    access[hostname].currentChannel = channelClaimId
    localStorage.setItem(AccountService.accessStorageKey, JSON.stringify(access));
  }

  public walletLogout() {
    this.putWallet(null)
    this.clearAccess()
    this.clearChannels()
  }

  public walletLogin(wallet: object | null) {
    // no ambiguity from half-completed actions
    // make sure we're fully logged out
    this.walletLogout()

    this.putWallet(wallet)
    this.initAccess()
    this.updateChannels()
  }

  // TODO - delete this if I don't end up using it
  public walletIsLoggedIn(): boolean {
    return (
      // All three should be set. It means the last login was complete, and no
      // logout was started since.
      this.hasAccess() && this.hasChannels() && this.hasWallet()
    )
  }

  // TODO: Do we want to save per-hostname-per-channel-per-action access levels
  // between logins? Counterargument: users probably won't log in and out too
  // often.
  private appClearAccess(hostname: string): void {
    const access = JSON.parse(localStorage.getItem(AccountService.accessStorageKey) || '{}');
    delete access[hostname]
    localStorage.setItem(AccountService.accessStorageKey, JSON.stringify(access));
  }

  public appLogout(hostname: string): void {
    this.appClearAccess(hostname)
  }

}
