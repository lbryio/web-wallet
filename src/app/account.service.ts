import {Injectable} from '@angular/core';
import {CryptoService} from './crypto.service';
import {GlobalVarsService} from './global-vars.service';
import {AccessLevel, PrivateAccountInfo, PublicAccountInfo} from '../types/identity';

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

  getAccountNames(): any {
    // TODO - maybe write this in a safer, more future-perfect way since it's converting
    // private to public
    return Object.keys(this.getWalletAccounts());
  }

  // TODO - As of this writing, we want to share channel claim ids with the
  // account on login, and spending addresses on request (probably with
  // explicit permission)
  //
  // This is in a state in between what DeSo had and what
  // we want ultimately for LBRY.
  getPublicAccounts(): {[key: string]: PublicAccountInfo} {
    const hostname = this.globalVars.hostname;
    const privateAccounts = this.getWalletAccounts();
    const publicAccounts: {[key: string]: PublicAccountInfo} = {};

    for (const name of Object.keys(privateAccounts)) {
      const privateAccount = privateAccounts[name];
      const accessLevel = this.getAccessLevel(name, hostname);
      if (accessLevel === AccessLevel.None) {
        continue;
      }

      // TODO
      throw 'Implement the hmac properly'

      // TODO - why do we even have hmac if everything's in local storage anyway? 
      const accessLevelHmac = this.cryptoService.accessLevelHmac(accessLevel, privateAccount.seed);

      publicAccounts[name] = {
        name,
        network: privateAccount.ledger,
        accessLevel,
        accessLevelHmac,
      };
    }

    return publicAccounts;
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
