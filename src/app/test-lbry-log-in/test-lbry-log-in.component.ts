import { Component, OnInit } from '@angular/core';
import { CryptoService } from '../crypto.service';
import { SigningService } from '../signing.service';
import { IdentityService } from '../identity.service';
import { GlobalVarsService } from '../global-vars.service';

@Component({
  selector: 'app-test-lbry-log-in',
  templateUrl: './test-lbry-log-in.component.html',
  styleUrls: ['./test-lbry-log-in.component.scss']
})
export class TestLbryLogInComponent implements OnInit {

  constructor(
    private cryptoService: CryptoService,
    private signingService: SigningService,
    private identityService: IdentityService,
    private globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
    const wallet : object | null = this.cryptoService.getWallet(this.globalVars.hostname);
    (<HTMLInputElement>document.getElementById("wallet")).value = JSON.stringify(wallet, null, 2) || "";
  }

  saveWallet(): void {
    const walletStr = (<HTMLInputElement>document.getElementById("wallet")).value;
    const wallet = JSON.parse(walletStr)
    this.cryptoService.putWallet(this.globalVars.hostname, wallet);

    const addresses = this.signingService.getAddresses(wallet)
    this.finishFlow(addresses)
  }

  finishFlow(addresses: string[]): void {
    this.identityService.login({
      users: {}, // TODO sigh
      addresses,
    });
  }
}
