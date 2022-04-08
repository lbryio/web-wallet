// FYI: any request that needs the HttpOnly cookie to be sent (e.g. b/c the server
// needs the seed phrase) needs the {withCredentials: true} option. It may also needed to
// get the browser to save the cookie in the response.
// https://github.com/github/fetch#sending-cookies
import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { map, switchMap, catchError } from "rxjs/operators";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { IdentityService } from "./identity.service";

export class BackendRoutes {
  static RoutePathGetPsbt = "/transaction/psbt";
  static RoutePathBroadcastTransaction = "/transaction/broadcast";
  static RoutePathDecodeTransaction = "/transaction/decode";
}

export class User {
  PublicKeyBase58Check: string;
  EncryptedSeedHex: string;

  // ...And other profile related stuff. email? isAdmin? etc etc.
}

@Injectable({
  providedIn: "root",
})
export class BackendApiService {
  constructor(private httpClient: HttpClient, private identityService: IdentityService) {}

  // Store the identity users in localStorage
  IdentityUsersKey = "identityUsersV2";

  // Store last logged in user public key in localStorage
  LastLoggedInUserKey = "lastLoggedInUserV2";

  // Store the last identity service URL in localStorage
  LastIdentityServiceKey = "lastIdentityServiceURLV2";

  GetPsbt(endpoint: string, fromAddress: string, toAddress: string, desiredAmount: number): Observable<any> {
    // TODO - Without JSON.stringify for some reason the body comes through empty.
    // Not going to bother figuring this out now. We won't be using this http
    // library in the end anyway.
    return this.post(endpoint, BackendRoutes.RoutePathGetPsbt, JSON.stringify({
      fromAddress, toAddress, desiredAmount
    }));
  }

  BroadcastTransaction(endpoint: string, TransactionHex: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathBroadcastTransaction, JSON.stringify({
      transactionHex: TransactionHex,
    }));
  }

  DecodeTransaction(endpoint: string, TransactionHex: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathDecodeTransaction, JSON.stringify({
      transactionHex: TransactionHex,
    }));
  }



  SetStorage(key: string, value: any) {
    localStorage.setItem(key, value || value === false ? JSON.stringify(value) : "");
  }

  RemoveStorage(key: string) {
    localStorage.removeItem(key);
  }

  GetStorage(key: string) {
    const data = localStorage.getItem(key);
    if (data === "") {
      return null;
    }

    return JSON.parse(data);
  }



  // Assemble a URL to hit the BE with.
  _makeRequestURL(endpoint: string, routeName: string, adminPublicKey?: string): string {
    let queryURL = location.protocol + "//" + endpoint + routeName;
    // If the protocol is specified within the endpoint then use that.
    if (endpoint.startsWith("http")) {
      queryURL = endpoint + routeName;
    }
    if (adminPublicKey) {
      queryURL += `?admin_public_key=${adminPublicKey}`;
    }
    return queryURL;
  }

  _handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error("An error occurred:", error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` + `body was: ${JSON.stringify(error.error)}`);
    }
    // return an observable with a user-facing error message
    return throwError(error);
  }

  // Stores identity service users in identityService and localStorage
  setIdentityServiceUsers(users: any, publicKeyAdded?: string) {
    this.SetStorage(this.IdentityUsersKey, users);
    this.identityService.identityServiceUsers = users;
    this.identityService.identityServicePublicKeyAdded = publicKeyAdded;
  }

  signAndSubmitTransaction(endpoint: string, request: Observable<any>, PublicKeyBase58Check: string): Observable<any> {

    // TODO - this could be useful to us. Either we go via iframe or via popup window. But for now disabling this function.
    // stopping here for now
    alert("not implemented. see the code")
    return of(null)

    return request
      .pipe(
        switchMap((res) =>
          this.identityService
            .sign({
              transactionHex: res.TransactionHex,
              ...this.identityService.identityServiceParamsForKey(PublicKeyBase58Check),
            })
            .pipe(
              switchMap((signed) => {
                if (signed.approvalRequired) {
                  return this.identityService
                    .launch("/approve", {
                      tx: res.TransactionHex,
                    })
                    .pipe(
                      map((approved) => {
                        this.setIdentityServiceUsers(approved.users);
                        return { ...res, ...approved };
                      })
                    );
                } else {
                  return of({ ...res, ...signed });
                }
              })
            )
        )
      )
      .pipe(
        switchMap((res) => {
          // TODO - changed the function name, but I still need to handle this right!
          // stopping here for now
          alert("not implemented. see the code")
          return of(null)

          return this.BroadcastTransaction(endpoint, res.signedTransactionHex).pipe(
            map((broadcasted) => ({ ...res, ...broadcasted }))
          )
        })
      )
      .pipe(catchError(this._handleError));
  }

  get(endpoint: string, path: string) {
    return this.httpClient.get<any>(this._makeRequestURL(endpoint, path)).pipe(catchError(this._handleError));
  }

  post(endpoint: string, path: string, body: any): Observable<any> {
    if (endpoint.slice(-5) == ":8090") { // Suppress DeSo backend server calls. TODO - just remove those calls and remove this check.
      return this.httpClient.post<any>(this._makeRequestURL(endpoint, path), body).pipe(catchError(this._handleError));
    } else {
      return of(null)
    }
  }

  jwtPost(endpoint: string, path: string, publicKey: string, body: any): Observable<any> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(publicKey),
    });

    return request.pipe(
      switchMap((signed) => {
        body = {
          JWT: signed.jwt,
          ...body,
        };

        return this.post(endpoint, path, body).pipe(map((res) => ({ ...res, ...signed })));
      })
    );
  }
}
