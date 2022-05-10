import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HubService {
  hubEndpoint = '';

  constructor(
    private httpClient: HttpClient,
  ) {
    const hubHostname = environment.hubHostnames[
      Math.floor(Math.random() * environment.hubHostnames.length)
    ];
    this.hubEndpoint = `https://${hubHostname}`;
  }

  post(path: string, body: any): Observable<any> {
    return this.httpClient.post<any>(`${this.hubEndpoint}/${path}`, body);
  }

  // Just for stubbing until we get the real thing
  private rndStr() {
    return (Math.random() + 1).toString(16).substring(2);
  }

  // Obviously just a stub for the actual API
  public getChannels(xPubs: string[]): any {

    return [{
      claimId: this.rndStr(),
      handle: '@test-' + this.rndStr(),
      pubKeyAddress: this.rndStr(),
    }, {
      claimId: this.rndStr(),
      handle: '@test-' + this.rndStr(),
      pubKeyAddress: this.rndStr(),
    }]
  }

}
