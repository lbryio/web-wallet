import {Component, OnInit} from '@angular/core';
import {AccountService} from '../account.service';
import {IdentityService} from '../identity.service';
import {GlobalVarsService} from '../global-vars.service';
import {PublicChannelInfo} from '../../types/identity';

@Component({
  selector: 'app-log-in-app',
  templateUrl: './log-in-app.component.html',
  styleUrls: ['./log-in-app.component.scss']
})
export class LogInAppComponent implements OnInit {
  allChannels: {[key: string]: PublicChannelInfo} = {};
  hasChannels: boolean = false;

  constructor(
    private accountService: AccountService,
    private identityService: IdentityService,
    public globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
    this.allChannels = this.accountService.getChannels()
    this.hasChannels = Object.keys(this.allChannels).length > 0
  }

  selectAccount(channelClaimId: string): void {
    this.accountService.setAccessCurrentChannel(this.globalVars.hostname, channelClaimId)

    this.identityService.login({
      channel: this.accountService.getActiveChannel(this.globalVars.hostname),
      signedUp: false
    });
  }
}
