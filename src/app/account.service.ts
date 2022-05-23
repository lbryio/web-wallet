import {Injectable} from '@angular/core';
import {GlobalVarsService} from './global-vars.service';
import {HubService} from './hub.service';
import {AccessLevel, ActionType, PrivateAccountInfo, PublicChannelInfo} from '../types/identity';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private static walletStorageKey = 'wallet';
  private static channelsStorageKey = 'channels';
  private static accessStorageKey = 'access';

  constructor(
    private globalVars: GlobalVarsService,
    private hubService: HubService,
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

  public updateChannels() {
    let xPubs: string[] = this.getAccounts().map(account => account.public_key)
    let channels: {[key: string]: PublicChannelInfo} = {};
    for (const hubChannel of this.hubService.getChannels(xPubs)) {
      channels[hubChannel.claimId] = {
        claimId: hubChannel.claimId,
        handle: hubChannel.handle,
        pubKeyAddress: hubChannel.pubKeyAddress,
        // TODO -- more fields?
      }
    }
    localStorage.setItem(AccountService.channelsStorageKey, JSON.stringify(channels));
  }

  public hasChannels() {
    return !!localStorage.getItem(AccountService.channelsStorageKey);
  }

  public getChannels() {
    return JSON.parse(localStorage.getItem(AccountService.channelsStorageKey) || '{}');
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
    const channels = this.getChannels()
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
