import {BackendAPIService} from '../backend-api.service';
import {Component, OnInit} from '@angular/core';
import {AccountService} from '../account.service';
import {CryptoService} from '../crypto.service';
import {GlobalVarsService} from '../global-vars.service';
import {Router} from '@angular/router';
import {RouteNames} from '../app-routing.module';
import {of} from 'rxjs';

// This component handles two ways of logging in:
// * Wallet Sync (currently commented out)
// * Paste Wallet (temporary measure for initial version)

@Component({
  selector: 'app-log-in-wallet',
  templateUrl: './log-in-wallet.component.html',
  styleUrls: ['./log-in-wallet.component.scss']
})
export class LogInWalletComponent implements OnInit {
  walletDumpInitial = this.getWalletDumpInitial();

  loginError = '';
  loginUsername = '';
  loginPassword = '';

  constructor(
    private backendApi: BackendAPIService,
    private cryptoService: CryptoService,
    private accountService: AccountService,
    public globalVars: GlobalVarsService,
    private router: Router,
  ) { }

  ngOnInit(): void {}

  // Wallet Sync (WIP, unused atm)

  clickLogin() {
    // Store username and password locally because we clear them below and otherwise
    // they don't get saved in local storage reliably
    const loginUsername = this.loginUsername;
    const loginPassword = this.loginPassword;

    if (loginUsername.length === 0) {
      this.loginError = 'Enter a username';
      return of();
    }

    if (loginPassword.length === 0) {
      this.loginError = 'Enter a password';
      return of();
    }

    // Returning the observable only because I'm in the habit of returning
    // promises. But maybe it's not needed here.
    return this.backendApi.WalletSyncLogin(loginUsername, loginPassword).subscribe(
      (res => {
        if (res === null) {
          this.loginError = "Login Error. Try again?"
          return
        }

        const walletStr = res.bodyJson
        const walletSignature = res.signature

        if (!this.cryptoService.checkSig(walletStr, walletSignature)) {
          this.loginError = 'Wallet signature failed!';
          return
        }
        const wallet = JSON.parse(res.bodyJson)
        const walletError: string | null = this.cryptoService.validateWallet(wallet);

        if (walletError !== null) {
          this.loginError = "Wallet error: " + walletError;
          return
        }

        this.accountService.walletLogin(wallet);

        // Clear the form
        this.loginUsername = '';
        this.loginPassword = '';

        this.router.navigate(['/', RouteNames.LOG_IN_APP], {queryParamsHandling: 'merge'});
      }),
      (() => {
        this.loginError = "Login Error. Try again?"
      })
    );
  }

  // Paste Wallet (temporary measure for initial version)

  getWalletDumpInitial() {
    const wallet : object | null = this.accountService.getWallet();
    return JSON.stringify(wallet, null, 2) || ""
  }

  loginWithWalletDump(): void {
    const walletStr = (<HTMLInputElement>document.getElementById("wallet-dump")).value;
    const wallet = JSON.parse(walletStr)
    this.accountService.walletLogin(wallet);

    this.router.navigate(['/', RouteNames.LOG_IN_APP], {queryParamsHandling: 'merge'});
  }

}
