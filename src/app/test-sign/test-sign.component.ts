import {AccountService} from '../account.service';
import {Component, OnInit} from '@angular/core';
import {SigningService} from '../signing.service';
import {IdentityService} from '../identity.service';

// TODO - switch to using private key as well for this
// TODO - rename to sign-action, or just take over the approval page later

@Component({
  selector: 'app-test-sign',
  templateUrl: './test-sign.component.html',
  styleUrls: ['./test-sign.component.scss']
})
export class TestSignComponent implements OnInit {

  signatureHex?: string
  // NOTE - we're bypassing the seedHex business, since we'll be working with the wallet file
  // ... unless this happens to work exactly the same way?
  privateKeyString: string = "thhUUVXQtyxonMaezCKwihLw9tZUrGJgWBMxDNfxoWub8dLGA"

  constructor(
    private accountService: AccountService,
    private signingService: SigningService,
    private identityService: IdentityService,
  ) { }

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const actionHex = params.get("actionHex") || null

    if (actionHex !== null) {
      this.signatureHex = this.signingService.signAction(this.privateKeyString, actionHex);
      this.finishFlow(this.signatureHex)
    }
  }

  finishFlow(signatureHex?: string): void {
    this.identityService.login({
      accounts: this.accountService.getPublicAccounts(),
      signatureHex,
    });
  }
}
