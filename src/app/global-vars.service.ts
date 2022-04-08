import { Injectable } from '@angular/core';
import {AccessLevel, Network} from '../types/identity';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GlobalVarsService {
  network = Network.mainnet;
  hostname = '';
  accessLevelRequest = AccessLevel.ApproveAll;

  inTab = !!window.opener;
  webview = false;

  // Derived key callback URL href / debug info
  callback = '';
  callbackInvalid = false;


  constructor() { }

  inFrame(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      // Most browsers block access to window.top when in an iframe
      return true;
    }
  }

  // tslint:disable-next-line:typedef
  get environment() {
    return environment;
  }
}
