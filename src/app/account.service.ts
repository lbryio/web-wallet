import {Injectable} from '@angular/core';
import {CryptoService} from './crypto.service';
import {GlobalVarsService} from './global-vars.service';
import {AccessLevel, PrivateAccountInfo, PublicChannelInfo} from '../types/identity';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private static levelsStorageKey = 'levels';

  constructor(
    private cryptoService: CryptoService,
    private globalVars: GlobalVarsService,
  ) { }

  // Public Getters

  // TODO - As of this writing, we want to share channel claim ids with the
  // account on login, and spending addresses on request (probably with
  // explicit permission)
  getChannels(): {[key: string]: PublicChannelInfo} {
    // TODO - will want for accessLevel stuff
    // const hostname = this.globalVars.hostname;

    const privateAccounts = this.getWalletAccounts();
    const channels: {[key: string]: PublicChannelInfo} = {};

    for (const name of Object.keys(privateAccounts)) {
      const privateAccount = privateAccounts[name];
      for (const channelPubKeyAddress of Object.keys(privateAccount.certificates)) {
        // TODO - For LBRY's purposes, not only will we want per-channel access
        // levels, we'll want per channel per hostname per action access levels.

        // TODO - finish when we have accessLevel stuff
        /*
        const accessLevel = this.getAccessLevel(name, hostname);
        if (accessLevel === AccessLevel.None) {
          continue;
        }

        // TODO - Implement the hmac properly
        // TODO - why do we even have hmac if everything's in local storage anyway?
        const accessLevelHmac = this.cryptoService.accessLevelHmac(accessLevel, privateAccount.seed);
        */

        channels[channelPubKeyAddress] = {
          pubKeyAddress: channelPubKeyAddress,
          network: privateAccount.ledger,

          // TODO - fill in when we have accessLevel stuff
          accessLevel: 0,
          accessLevelHmac: "",
        };
      }
    }

    return channels;
  }

  // TODO - Need to confirm that this works I think
  public getWalletAccounts(): {[key: string]: PrivateAccountInfo} {
    const wallet = this.cryptoService.getWallet(this.globalVars.hostname)
    if (wallet === null) {
      return {}
    }
    const filteredAccounts: {[key: string]: PrivateAccountInfo} = {};

    for (const account of wallet.accounts) {
      // Only include accounts from the current network
      if (account.ledger !== this.globalVars.network) {
        continue;
      }

      filteredAccounts[account.name] = account;
    }
    return filteredAccounts
  }

  getAccessLevel(accountName: string, hostname: string): AccessLevel {
    const levels = JSON.parse(localStorage.getItem(AccountService.levelsStorageKey) || '{}');
    const hostMapping = levels[hostname] || {};
    const accessLevel = hostMapping[accountName];

    if (Object.values(AccessLevel).includes(accessLevel)) {
      return accessLevel;
    } else {
      return AccessLevel.None;
    }
  }

  // Public Modifiers

  setAccessLevel(accountName: string, hostname: string, accessLevel: AccessLevel): void {
    const levels = JSON.parse(localStorage.getItem(AccountService.levelsStorageKey) || '{}');

    levels[hostname] ||= {};
    levels[hostname][accountName] = accessLevel;

    localStorage.setItem(AccountService.levelsStorageKey, JSON.stringify(levels));
  }

  // log out of hostname entirely by setting accesslevel to None
  resetAccessLevels(hostname: string): void {
    const levels = JSON.parse(localStorage.getItem(AccountService.levelsStorageKey) || '{}');

    levels[hostname] ||= {};
    for (const accountName in levels[hostname]) {
      levels[hostname][accountName] = AccessLevel.None;
    }

    localStorage.setItem(AccountService.levelsStorageKey, JSON.stringify(levels));
  }

}
