import {AccountService} from '../account.service';
import {Component, OnInit} from '@angular/core';
import {SigningService} from '../signing.service';
import {IdentityService} from '../identity.service';
import {GlobalVarsService} from '../global-vars.service';

@Component({
  selector: 'app-test-sign-transaction',
  templateUrl: './test-sign-transaction.component.html',
  styleUrls: ['./test-sign-transaction.component.scss']
})
export class TestSignTransactionComponent implements OnInit {

  signedTransactionHex?: string

  constructor(
    private accountService: AccountService,
    private signingService: SigningService,
    private identityService: IdentityService,
    private globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const psbtHex = params.get("psbtHex") || null
    const fromAddress = params.get("fromAddress") || ""
    const nonWitnessUtxoHexes = params.get("nonWitnessUtxoHexes") || null

    const wallet : object | null = this.accountService.getWallet();
    const signingKey = this.signingService.getSigningKey(wallet, fromAddress)

    // TODO what if error? etc etc.
    if (psbtHex !== null && nonWitnessUtxoHexes !== null && signingKey != null) {
      this.signedTransactionHex = this.signingService.signPSBT(
        psbtHex, nonWitnessUtxoHexes.split(","), signingKey);
      this.finishFlow(this.signedTransactionHex)
    }
  }

  finishFlow(signedTransactionHex?: string): void {
    this.identityService.login({
      channel: this.accountService.getActiveChannel(this.globalVars.hostname),
      signedTransactionHex,
    });
  }
}
