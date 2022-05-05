import {Component, OnInit} from '@angular/core';
import {AccountService} from '../account.service';
import {IdentityService} from '../identity.service';
import {GlobalVarsService} from '../global-vars.service';

@Component({
  selector: 'app-log-in-app',
  templateUrl: './log-in-app.component.html',
  styleUrls: ['./log-in-app.component.scss']
})
export class LogInAppComponent implements OnInit {
  allAccountNames: {[key: string]: string} = {};

  constructor(
    private accountService: AccountService,
    private identityService: IdentityService,
    public globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
    // TODO - Will be channel claim IDs
    this.allAccountNames = this.accountService.getAccountNames();
  }

  selectAccount(accountName: string): void {
    this.accountService.setAccessLevel(accountName, this.globalVars.hostname, this.globalVars.accessLevelRequest);
    this.identityService.login({
      accounts: this.accountService.getPublicAccounts(),
      accountNameAdded: accountName,
      signedUp: false
    });
  }
}
