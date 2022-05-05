import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {v4 as uuid} from 'uuid';
import {AccessLevel, PublicChannelInfo} from '../types/identity';
import {CryptoService} from './crypto.service';
import {GlobalVarsService} from './global-vars.service';
import {CookieService} from 'ngx-cookie';
import {SigningService} from './signing.service';
import {HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class IdentityService {
  // All outbound request promises we still need to resolve
  private outboundRequests: {[key: string]: any} = {};

  // Opener can be null, parent is never null
  private currentWindow = opener || parent;

  // Embed component checks for browser support
  browserSupported = true;

  constructor(
    private cryptoService: CryptoService,
    private globalVars: GlobalVarsService,
    private cookieService: CookieService,
    private signingService: SigningService,
  ) {
    window.addEventListener('message', (event) => this.handleMessage(event));
  }

  // Outgoing Messages

  initialize(): Observable<any> {
    return this.send('initialize', {});
  }

  storageGranted(): void {
    this.cast('storageGranted');
  }

  login(payload: {
    channels: {[key: string]: PublicChannelInfo},
    accountNameAdded?: string, // Which channel id was just authorized. the app may allow the user to switch between them, but this determines which is on now.
    signedUp?: boolean
    signedTransactionHex?: string,
    addresses?: string[],
    signatureHex?: string,
  }): void {
    if (this.globalVars.callback) { // TODO - is this something we can axe? (LBRY)
      // If callback is passed, we redirect to it with payload as URL parameters.
      let httpParams = new HttpParams();
      for (const key in payload) {
        if (payload.hasOwnProperty(key)) {
          httpParams = httpParams.append(key, (payload as any)[key].toString());
        }
      }
      window.location.href = this.globalVars.callback + `?${httpParams.toString()}`;
    } else {
      this.cast('login', payload);
    }
  }

  // Incoming Messages

  private handleSign(data: any): void {
    // TODO
    throw "implement for lbry"
    /*
    const transaction or action details = data;

    // This will tell us whether we need full signing access or just ApproveLarge
    // level of access.
    const requiredAccessLevel = this.getRequiredAccessLevel(transaction or action details);

    // In the case that approve() fails, it responds with a message indicating
    // that approvalRequired = true, which the caller can then uses to trigger
    // the /approve UI.
    if (!this.approve(data, requiredAccessLevel)) {
      return;
    }

    // TODO - this.signingService.signPSBT instead
    if it's a transaction
      const signedTransactionHex = this.signingService.signPSBT(transaction details);
    else // just an action
      const signedActionHex = this.signingService.signActiov(action details);

    // TODO figure this out...
    this.respond(id, {
      signedTransactionHex,
      signedActionHex,
    });
    */
  }

  private handleJwt(data: any): void {
    // Give a permission token that expires in 10 minutes. DeSo apps use it for
    // things like image uploading. Creation of this token is subject to same
    // access level requirements as actions and transactions.
    // TODO - make this work with LBRY. Or, nix it if we know we don't need it.
    // Perhaps this will actually *be* our "actions"?

    if (!this.approve(data, AccessLevel.ApproveAll)) {
      return;
    }

    const { id, payload: { encryptedSeedHex } } = data;
    const seedHex = this.cryptoService.decryptSeedHex(encryptedSeedHex, this.globalVars.hostname);
    const jwt = this.signingService.signJWT(seedHex);

    this.respond(id, {
      jwt
    });
  }

  private async handleInfo(event: MessageEvent): Promise<void> {
    // check storage access API
    let hasStorageAccess = true;
    if (this.cryptoService.mustUseStorageAccess()) {
      hasStorageAccess = await document.hasStorageAccess();
    }

    // check for localStorage access
    let hasLocalStorageAccess;
    try {
      hasLocalStorageAccess = !!localStorage;
    } catch (e) {
      hasLocalStorageAccess = false;
    }

    // check for cookie access
    this.cookieService.put('deso-test-access', 'true');
    const hasCookieAccess = !!this.cookieService.get('deso-test-access');

    // store if browser is supported or not
    this.browserSupported = hasCookieAccess || hasLocalStorageAccess;

    this.respond(event.data.id, {
      hasCookieAccess,
      hasStorageAccess,
      hasLocalStorageAccess,
      browserSupported: this.browserSupported,
    });
  }

  // Access levels

  // TODO implement for lbry
  // private getRequiredAccessLevel(transactionHex: string): AccessLevel {
  // switch case on the type of transaction or action, and return the required access level
  // unless required access level is going to be case by case for each user

  private hasAccessLevel(data: any, requiredAccessLevel: AccessLevel): boolean {
    const { payload: { encryptedSeedHex, accessLevel, accessLevelHmac }} = data;
    if (accessLevel < requiredAccessLevel) {
      return false;
    }

    const seedHex = this.cryptoService.decryptSeedHex(encryptedSeedHex, this.globalVars.hostname);
    return this.cryptoService.validAccessLevelHmac(accessLevel, seedHex, accessLevelHmac);
  }

  private approve(data: any, accessLevel: AccessLevel): boolean {
    const hasAccess = this.hasAccessLevel(data, accessLevel);
    const hasEncryptionKey = this.cryptoService.hasSeedHexEncryptionKey(this.globalVars.hostname);

    if (!hasAccess || !hasEncryptionKey) {
      this.respond(data.id, { approvalRequired: true });
      return false;
    }

    return true;
  }

  // Message handling

  private handleMessage(event: MessageEvent): void {
    const { data } = event;
    const { service, method } = data;

    if (service !== 'identity') { return; }

    // Methods are present on incoming requests but not responses
    if (method) {
      this.handleRequest(event);
    } else {
      this.handleResponse(event);
    }
  }

  private handleRequest(event: MessageEvent): void {
    const data = event.data;
    const method = data.method;

    if (method === 'sign') {
      this.handleSign(data);
    } else if (method === 'jwt') {
      this.handleJwt(data);
    } else if (method === 'info') {
      this.handleInfo(event);
    } else {
      console.error('Unhandled identity request');
      console.error(event);
    }
  }

  private handleResponse(event: MessageEvent): void {
    const { data: { id, payload }, origin } = event;
    const hostname = new URL(origin).hostname;
    const result = {
      id,
      payload,
      hostname,
    };

    const req = this.outboundRequests[id];
    req.next(result);
    req.complete();
    delete this.outboundRequests[id];
  }

  // Send a new message and expect a response
  private send(method: string, payload: any): Subject<any> {
    const id = uuid();
    const subject = new Subject();
    this.outboundRequests[id] = subject;

    this.postMessage({
      id,
      service: 'identity',
      method,
      payload,
    });

    return subject;
  }

  // Respond to a received message
  private respond(id: string, payload: any): void {
    this.postMessage({
      id,
      service: 'identity',
      payload
    });
  }

  // Transmit a message without expecting a response
  private cast(method: string, payload?: any): void {
    this.postMessage({
      id: null,
      service: 'identity',
      method,
      payload,
    });
  }

  // Post message to correct client
  private postMessage(message: any): void {
    if (this.globalVars.webview) {
      if (this.currentWindow.webkit?.messageHandlers?.desoIdentityAppInterface !== undefined) {
        // iOS Webview with registered "desoIdentityAppInterface" handler
        this.currentWindow.webkit.messageHandlers.desoIdentityAppInterface.postMessage(message, '*');
      } else if (this.currentWindow.desoIdentityAppInterface !== undefined) {
        // Android Webview with registered "desoIdentityAppInterface" handler
        this.currentWindow.desoIdentityAppInterface.postMessage(JSON.stringify(message), '*');
      } else if (this.currentWindow.ReactNativeWebView !== undefined) {
        // React Native Webview with registered "ReactNativeWebView" handler
        this.currentWindow.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    } else {
      this.currentWindow.postMessage(message, '*');
    }
  }
}
