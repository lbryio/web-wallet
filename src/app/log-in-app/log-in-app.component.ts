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
    this.allChannels = this.accountService.getChannelsPublic()
    this.hasChannels = Object.keys(this.allChannels).length > 0
  }

  selectAccount(channelClaimId: string): void {
    this.accountService.setAccessCurrentChannel(this.globalVars.hostname, channelClaimId)
    // At this point, DeSo had globalVars.accessLevelRequest, where the app
    // would specify which access level it would be operating with, and the
    // user would grant permission on login. We could do something similar: The
    // app could specify which sorts of actions it will be likely asking
    // permission for. The user could specify on login "don't bother asking my
    // permission for these actions" so they never get a popup for it.

    this.identityService.login({
      channel: this.accountService.getActiveChannel(this.globalVars.hostname),
      signedUp: false
    });
  }
}
