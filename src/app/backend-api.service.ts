import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {SigningService} from './signing.service';
import {AccountService} from './account.service';
import {CryptoService} from './crypto.service';
import {GlobalVarsService} from './global-vars.service';
import {UserProfile} from '../types/identity';

export class ProfileEntryResponse {
  Username: string | null = null;
  Description: string | null = null;
  ProfilePic?: string;
  PublicKeyBase58Check?: string;
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

  // When SkipForLeaderboard is true, this endpoint only returns ProfileEntryResponse, IsGraylisted, IsBlacklisted,
  //  IsAdmin, and IsSuperAdmin for each user.
  // When SkipForLeaderboard is false, we also fetch the user's balance, profiles this user follows, hodlings,  and
  //  UserMetadata. Oftentimes, this information is not needed and excluding it significantly improves performance.
  GetUsersStateless(
    publicKeys: string[], SkipForLeaderboard: boolean = false,
  ): Observable<{ UserList: User[]}> {
    return this.httpClient.post<any>(
      `${this.endpoint}/get-users-stateless`,
      {
        PublicKeysBase58Check: publicKeys,
        SkipForLeaderboard,
      },
    );
  }

  GetUserProfiles(
    publicKeys: string[]
  ): Observable<{[key: string]: UserProfile}> {
      const userProfiles: {[key: string]: any} = {};
      const req = this.GetUsersStateless(publicKeys, true);
      if (publicKeys.length > 0) {
        return req.pipe(
          map( res => {
            for (const user of res.UserList) {
              userProfiles[user.PublicKeyBase58Check] = {
                username: user.ProfileEntryResponse?.Username,
              };
            }
            return userProfiles;
          })
        ).pipe(
          catchError(() => {
            for(const publicKey of publicKeys) {
              userProfiles[publicKey] = {};
            }
            return of(userProfiles);
          })
        );
      } else {
        return of(userProfiles);
      }
  }
}
