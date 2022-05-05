import { Injectable } from "@angular/core";
import {
  BackendApiService,
  User,
} from "./backend-api.service";
import { Observable } from "rxjs";
import { environment } from "../environments/environment";
import { DomSanitizer } from "@angular/platform-browser";
import { IdentityService } from "./identity.service";

@Injectable({
  providedIn: "root",
})
export class GlobalVarsService {
  constructor(
    private backendApi: BackendApiService,
    private sanitizer: DomSanitizer,
    private identityService: IdentityService,
  ) {}

  // We track logged-in state
  loggedInUser: User;
  userList: User[] = [];

  browserSupported = false;

  // NEVER change loggedInUser property directly. Use this method instead.
  // TODO delete this or repurpose it for LBRY
  setLoggedInUser(user: User) {
    const isSameUserAsBefore =
      this.loggedInUser && user && this.loggedInUser.PublicKeyBase58Check === user.PublicKeyBase58Check;

    this.loggedInUser = user;

    if (!isSameUserAsBefore) {
      // Store the user in localStorage
      this.backendApi.SetStorage(this.backendApi.LastLoggedInUserKey, user?.PublicKeyBase58Check);
    }
  }

  Init(loggedInUser: User, userList: User[]) {
    this.userList = userList;

    let identityServiceURL = this.backendApi.GetStorage(this.backendApi.LastIdentityServiceKey);
    if (!identityServiceURL) {
      identityServiceURL = environment.identityURL;
      this.backendApi.SetStorage(this.backendApi.LastIdentityServiceKey, identityServiceURL);
    }
    this.identityService.identityServiceURL = identityServiceURL;
    this.identityService.sanitizedIdentityServiceURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${identityServiceURL}/embed?v=2`
    );
  }

  testSignActionLBRY() : Observable<string> {
    const testActionHex = "deadbeefc001b0b1337"
    return new Observable(subscriber => {
      this.identityService.launch("/test-sign", { actionHex: testActionHex }).subscribe((res) => {
        subscriber.next(res.signatureHex)
        subscriber.complete()
      });
    });
  }

  testSignTransactionLBRY(psbtHex: string, nonWitnessUtxoHexes: string[], fromAddress: string) : Observable<string> {
    return new Observable(subscriber => {
      this.identityService.launch("/test-sign-transaction", { psbtHex, nonWitnessUtxoHexes: nonWitnessUtxoHexes.join(","), fromAddress }).subscribe((res) => {
        subscriber.next(res.signedTransactionHex)
        subscriber.complete()
      });
    });
  }

  testLoginLBRY() : Observable<string[]> {
    return new Observable(subscriber => {
      this.identityService.launch("/log-in-wallet", {}).subscribe((res) => {
        // TODO - maybe we want public key instead of address? we should, as DeSo did, have a list of users with everything we need from them.
        subscriber.next(res.addresses)
        subscriber.complete()
      });
    });
  }
}
