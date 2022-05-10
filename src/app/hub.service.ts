import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HubService {
  hubEndpoint = `https://${environment.hubHostname}/api/v0`;

  constructor(
    private httpClient: HttpClient,
  ) { }

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
