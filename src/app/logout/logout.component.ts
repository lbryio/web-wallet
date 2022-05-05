import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CryptoService} from '../crypto.service';
import {IdentityService} from '../identity.service';
import {AccountService} from '../account.service';
import {GlobalVarsService} from '../global-vars.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {
  publicKey = '';
  logoutError = '';

  @ViewChild('seedText') seedText: ElementRef | undefined;
  @ViewChild('extraText') extraText: ElementRef | undefined;


  constructor(
    private cryptoService: CryptoService,
    private identityService: IdentityService,
    private accountService: AccountService,
    public globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.finishFlow();
  }

  onSubmit(): void {
    // We set the accessLevel for the logged out user to None.
    this.accountService.resetAccessLevels(this.globalVars.hostname);
    // We reset the seed encryption key so that all existing accounts, except
    // the logged out user, will regenerate their encryptedSeedHex. Without this,
    // someone could have reused the encryptedSeedHex of an already logged out user.
    this.cryptoService.seedHexEncryptionKey(this.globalVars.hostname, true);
    this.finishFlow();
  }

  finishFlow(): void {
    this.identityService.login({
      channels: this.accountService.getChannels(),
    });
  }

}
