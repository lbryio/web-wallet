import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {AccountService} from './account.service';

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
  walletSyncEndpoint = `https://${environment.walletSyncHostname}/api/v0`;

  endpoint = `https://${environment.nodeHostname}/api/v0`;

  constructor(
    private httpClient: HttpClient,
    private accountService: AccountService,
  ) { }

  post(path: string, body: any): Observable<any> {
    return this.httpClient.post<any>(`${this.endpoint}/${path}`, body);
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

  // TODO - WIP, not using for now.
  
  // This isn't what the current wallet sync API looks like, but it will
  // likely change anyway. So this is an approximation with a stub for the time being.
  WalletSyncLogin(
    username: string,
    password: string,
  ): Observable<{bodyJson: string, signature: string} | null> {

    // A stub for now
    const wallet : object | null = this.accountService.getWallet();
    if (wallet === null) {
      return of(null)
    }

    return of({
      bodyJson: JSON.stringify(wallet, null, 2),
      signature: "",
    })

    // Later we'll do something like this...
    return this.httpClient.post<any>(
      `${this.walletSyncEndpoint}/log-in`,
      {
        username: username,
        password: password,
      },
    );
  }
}
