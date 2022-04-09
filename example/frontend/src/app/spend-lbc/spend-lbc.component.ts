import { Component, OnInit } from "@angular/core";
import { AppRoutingModule } from "../app-routing.module";
import { GlobalVarsService } from "../global-vars.service";
import { environment } from "src/environments/environment";
import { BackendApiService } from "../backend-api.service";

@Component({
  selector: "app-spend-lbc",
  templateUrl: "./spend-lbc.component.html",
  styleUrls: ["./spend-lbc.component.scss"],
})
export class SpendLBCComponent implements OnInit {
  AppRoutingModule = AppRoutingModule;
  environment = environment;
  signatureHex = "";
  signedTransactionHex = "";
  psbtHex = "";
  fromAddresses: string[] = [];
  fromAddress: string = "";
  nonWitnessUtxoHexes: string[] = [];
  decodedTransaction = "";
  lastError = "";
  lastErrorFull = "";
  actualAmount = 0;
  fee = 0;
  success = "";

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
  ) {}

  setError(err) {
    if (err) {
      this.success = ""
      if (typeof err.error === "string") {
        this.lastError = err.error
      } else {
        this.lastError = JSON.stringify(err.error, null, 2)
      }
      this.lastErrorFull = JSON.stringify(err, null, 2)
    } else {
      this.lastErrorFull = this.lastError = ""
    }
  }

  ngOnInit() {
  }

  testSignActionLBRY() {
    this.globalVars.testSignActionLBRY().subscribe({
      next: (signatureHex) => {
        this.signatureHex = signatureHex
      },
      error: err => { this.setError(err) }
    })
  }

  updatePsbt() {
    const toAddress = (<HTMLInputElement>document.getElementById("toAddress")).value;
    const desiredAmount = Number((<HTMLInputElement>document.getElementById("desiredAmount")).value);

    this.backendApi.GetPsbt(environment.backendHostname, this.fromAddress, toAddress, desiredAmount).subscribe({
      next: res => {
        this.psbtHex = res.psbtHex
        this.nonWitnessUtxoHexes = res.nonWitnessUtxoHex
        this.actualAmount = res.actualAmount
        this.fee = res.actualAmount - desiredAmount

        this.decodedTransaction = ""
        this.signedTransactionHex = ""
        this.setError(res.error && res)
      },
      // for some reason this leads to the function getting called with the same
      // parameters but the values on the page don't get updated:
      //
      // error: this.setError
      //
      // so instead we do it more verbosely:
      //

      error: err => {
        this.setError(err)
      }
    })
  }

  testLoginLBRY() {
    this.globalVars.testLoginLBRY().subscribe({
      next: (addresses) => {
        this.fromAddresses = addresses
        this.fromAddress = addresses[0]
      },
      error: err => { this.setError(err) }
    })
  }

  testSignTransactionLBRY() {
    this.globalVars.testSignTransactionLBRY(this.psbtHex, this.nonWitnessUtxoHexes, this.fromAddress).subscribe({
      next: (signedTransactionHex) => {
        this.signedTransactionHex = signedTransactionHex
        this.backendApi.DecodeTransaction(environment.backendHostname, signedTransactionHex).subscribe({
          next: res => {
            this.decodedTransaction = res.decodedTransaction
            console.log(res.decodedTransaction)
          },
          error: err => { this.setError(err) }
        })
        this.backendApi.BroadcastTransaction(environment.backendHostname, signedTransactionHex).subscribe({
          next: res => {
            this.setError(null)
            this.success = res.txid
          },
          error: err => { this.setError(err) }
        })
      },
      error: err => { this.setError(err) }
    })
  }

  // TODO - store LBRY user identifier somewhere, maybe username, maybe collection of public keys in a wallet.
  // And then query on the app side for the user's other info (profile?) as needed, from a hub or Odysee server or whatever.
  // At least something, like avatar, so we have an example for developers. Do use the existing User struct for this.
  // We won't have a list of users, but we will have a list of _accounts_ attached to the user.
  // Actually maybe we won't! That's not good privacy.
}





  // This demonstrates how to merge identity users with lbry users
  // Actually maybe I should just go ahead and do this! At least a basic
  // version. Then I can take it out of this "interesting example" file.

  // actually... we don't need a list of users
  // actually... maybe we need a list of accounts?

  /*
  launchLogoutFlow() {
    const publicKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    this.identityService.launch("/logout", { publicKey }).subscribe((res) => {
      this.globalVars.userList = filter(this.globalVars.userList, (user) => {
        return res?.users && user?.PublicKeyBase58Check in res?.users;
      });
      if (!res?.users) {
        this.globalVars.userList = [];
      }
      let loggedInUser = get(Object.keys(res?.users), "[0]");
      if (this.globalVars.userList.length === 0) {
        loggedInUser = null;
        this.globalVars.setLoggedInUser(null);
      }
      this.backendApi.setIdentityServiceUsers(res.users, loggedInUser);
      this.globalVars.updateEverything().add(() => {
        this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE]);
      });
    });
  }
  */
