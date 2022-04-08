import { Component, OnInit } from '@angular/core';
import {AccountService} from '../account.service';
import {CryptoService} from '../crypto.service';
import {EntropyService} from '../entropy.service';
import {GlobalVarsService} from '../global-vars.service';
import {Router} from '@angular/router';
import {RouteNames} from '../app-routing.module';

@Component({
  selector: 'app-load-seed',
  templateUrl: './load-seed.component.html',
  styleUrls: ['./load-seed.component.scss']
})
export class LoadSeedComponent implements OnInit {
  // Loading an account
  loadSeedError = '';
  mnemonic = '';
  extraText = '';

  constructor(
    private accountService: AccountService,
    private cryptoService: CryptoService,
    private entropyService: EntropyService,
    public globalVars: GlobalVarsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
  }

  clickLoadAccount(): void {
    // Store mnemonic and extraText locally because we clear them below and otherwise
    // they don't get saved in local storage reliably
    const mnemonic = this.mnemonic;
    const extraText = this.extraText;
    const network = this.globalVars.network;

    if (!this.entropyService.isValidMnemonic(mnemonic)) {
      this.loadSeedError = 'Invalid mnemonic';
      return;
    }

    const keychain = this.cryptoService.mnemonicToKeychain(mnemonic, extraText);

    this.accountService.addUser(keychain, mnemonic, extraText, network);

    // Clear the form
    this.mnemonic = '';
    this.extraText = '';

    this.router.navigate(['/', RouteNames.LOG_IN], {queryParamsHandling: 'merge'});
  }
}
