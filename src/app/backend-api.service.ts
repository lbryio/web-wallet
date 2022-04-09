import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {SigningService} from './signing.service';
import {AccountService} from './account.service';
import {CryptoService} from './crypto.service';
import {GlobalVarsService} from './global-vars.service';

export class ProfileEntryResponse {
  Username: string | null = null;
}

export class User {
  ProfileEntryResponse: ProfileEntryResponse | null = null;
  PublicKeyBase58Check: string = "";
}

@Injectable({
  providedIn: 'root'
})
export class BackendAPIService {
  endpoint = `https://${environment.nodeHostname}/api/v0`;

  constructor(
    private httpClient: HttpClient,
    private cryptoService: CryptoService,
    private signingService: SigningService,
    private accountService: AccountService,
    private globalVars: GlobalVarsService,
  ) { }

  post(path: string, body: any): Observable<any> {
    return this.httpClient.post<any>(`${this.endpoint}/${path}`, body);
  }

  jwtPost(path: string, publicKey: string, body: any): Observable<any> {
    const publicUserInfo = this.accountService.getEncryptedUsers()[publicKey];
    if (!publicUserInfo) {
      return of(null);
    }

    const seedHex = this.cryptoService.decryptSeedHex(publicUserInfo.encryptedSeedHex, this.globalVars.hostname);
    const jwt = this.signingService.signJWT(seedHex);
    return this.post(path, {...body, ...{JWT: jwt}});
  }

  GetUsersStateless(
    publicKeys: string[]
  ): Observable<{ UserList: User[]}> {
    return this.httpClient.post<any>(
      `${this.endpoint}/get-users-stateless`,
      {
        PublicKeysBase58Check: publicKeys,
      },
    );
  }

  GetUsernames(
    publicKeys: string[]
  ): Observable<{[key: string]: string}> {
      const usernames: {[key: string]: any} = {};
      const req = this.GetUsersStateless(publicKeys);
      if (publicKeys.length > 0) {
        return req.pipe(
          map( res => {
            for (const user of res.UserList) {
              usernames[user.PublicKeyBase58Check] = user.ProfileEntryResponse?.Username
            }
            return usernames;
          })
        ).pipe(
          catchError(() => {
            for(const publicKey of publicKeys) {
              usernames[publicKey] = "";
            }
            return of(usernames);
          })
        );
      } else {
        return of(usernames);
      }
  }
}
