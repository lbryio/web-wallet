import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HubService {

  constructor(
  ) { }

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
