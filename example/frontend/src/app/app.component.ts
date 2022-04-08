import { Component, OnInit } from "@angular/core";
import { BackendApiService } from "./backend-api.service";
import { GlobalVarsService } from "./global-vars.service";
import { IdentityService } from "./identity.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    private backendApi: BackendApiService,
    public globalVars: GlobalVarsService,
    public identityService: IdentityService,
  ) {
    this.globalVars.Init(
      null, // loggedInUser
      [], // userList TODO - accountList? If we do this.
    );

    // Nuke the referrer so we don't leak anything
    // We also have a meta tag in index.html that does this in a different way to make
    // sure it's nuked.
    //
    //
    // TODO: I'm pretty sure all of this could fail on IE so we should make sure people
    // only use the app with chrome.
    Object.defineProperty(document, "referrer", {
      get() {
        return "";
      },
    });
    Object.defineProperty(document, "referer", {
      get() {
        return "";
      },
    });
  }

  ngOnInit() {
    this.identityService.info().subscribe((res) => {
      // If the browser is not supported, display the browser not supported screen.
      if (res.browserSupported) {
        this.globalVars.browserSupported = true;
        this.loadApp();
      }
    });
  }

  // TODO Plug LBRY accounts into local storage
  loadApp() {
    this.identityService.identityServiceUsers = this.backendApi.GetStorage(this.backendApi.IdentityUsersKey) || {};
    // Filter out invalid public keys
    const publicKeys = Object.keys(this.identityService.identityServiceUsers);
    for (const publicKey of publicKeys) {
      if (!publicKey.match(/^[a-zA-Z0-9]{54,55}$/)) {
        delete this.identityService.identityServiceUsers[publicKey];
      }
    }
    this.backendApi.SetStorage(this.backendApi.IdentityUsersKey, this.identityService.identityServiceUsers);
  }
}
