import {Component, OnInit} from '@angular/core';
import {GlobalVarsService} from './global-vars.service';
import {IdentityService} from './identity.service';
import {Network} from '../types/identity';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'identity';

  loading = true;

  constructor(
    private globalVars: GlobalVarsService,
    private identityService: IdentityService,
  ) { }

  ngOnInit(): void {
    // load params
    const params = new URLSearchParams(window.location.search);

    const accessLevelRequest = params.get('accessLevelRequest');
    if (accessLevelRequest) {
      this.globalVars.accessLevelRequest = parseInt(accessLevelRequest, 10);
    }

    if (params.get('webview')) {
      this.globalVars.webview = true;
    }

    if (params.get('testnet')) {
      this.globalVars.network = Network.testnet;
    }

    // Callback should only be used in mobile applications, where payload is passed through URL parameters.
    const callback = params.get('callback');
    if (callback) {
      try {
        const callbackURL = new URL(callback as string);
        this.globalVars.callback = callbackURL.href;
      } catch (err) {
        this.globalVars.callbackInvalid = true;
        console.error(err);
      }
    }

    if (this.globalVars.callback) {
      // If callback is set, we won't be sending the initialize message.
      this.globalVars.hostname = 'localhost';
      this.finishInit();
    } else if (this.globalVars.webview || this.globalVars.inTab || this.globalVars.inFrame()) {
      // We must be running in a webview OR opened with window.open OR in an iframe to initialize
      this.identityService.initialize().subscribe(res => {
        this.globalVars.hostname = res.hostname;

        this.finishInit();
      });
    } else {
      // Identity currently doesn't have any management UIs that can be accessed directly
      window.location.href = `https://deso.org`;
    }
  }

  finishInit(): void {
    // Finish loading
    this.loading = false;
  }
}
