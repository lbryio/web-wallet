import {Component, OnDestroy, OnInit} from '@angular/core';
import {EntropyService} from '../entropy.service';
import {AccountService} from '../account.service';
import {IdentityService} from '../identity.service';
import {GlobalVarsService} from '../global-vars.service';
import {environment} from '../../environments/environment';
import {ActivatedRoute} from '@angular/router';
import {TextService} from '../text.service';
import * as bip39 from 'bip39';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit, OnDestroy {
  stepNum = 1;
  seedCopied = false;
  mnemonicCheck = '';
  extraTextCheck = '';
  accountNameAdded = '';

  // Advanced tab
  showMnemonicError = false;
  showEntropyHexError = false;

  loginMessagePayload: any;
  environment = environment;

  stepTotal: number;

  constructor(
    public entropyService: EntropyService,
    private accountService: AccountService,
    private identityService: IdentityService,
    public globalVars: GlobalVarsService,
    private activatedRoute: ActivatedRoute,
    private textService: TextService,
  ) {
    this.stepTotal = 2;

    // in case of jumio, stepTotal is set to 3. I guess this case would set it back to 2, but I don't understand why.
    // keeping this until I understand what it's there to prevent, or I don't care about this page at all
    if (this.activatedRoute.snapshot.queryParamMap.has('origin')) {
      this.stepTotal = 2;
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    // Set new entropy for the next time they go through the flow.
    this.entropyService.setNewTemporaryEntropy();
    this.entropyService.advancedOpen = false;
  }

  ////// STEP ONE BUTTONS ///////

  stepOneCopy(): void {
    this.textService.copyText(this.entropyService.temporaryEntropy?.mnemonic || '');
    this.seedCopied = true;
  }

  stepOneDownload(): void {
    const contents = `${this.entropyService.temporaryEntropy?.mnemonic}\n\n${this.entropyService.temporaryEntropy?.extraText}`;
    this.textService.downloadText(contents, 'deso-seed.txt');
  }

  stepOnePrint(): void {
    window.print();
  }

  stepOneNext(): void {
    this.stepNum = 2;
    this.seedCopied = false; // Reset the copy icon.
  }

  ////// STEP TWO BUTTONS ///////

  stepTwoNext(): void {
    // TODO - signup for LBRY will be very different from DeSo. We'll need to
    // make a wallet, not just "users". And other things happen.
    throw 'signup not implemented'

    /*
    const network = this.globalVars.network;
    const mnemonic = this.mnemonicCheck;
    const extraText = this.extraTextCheck;
    const keychain = this.cryptoService.mnemonicToKeychain(mnemonic, extraText);

    this.accountNameAdded = this.accountService.addUser(keychain, mnemonic, extraText, network);

    this.accountService.setAccessLevel(
      this.accountNameAdded, this.globalVars.hostname, this.globalVars.accessLevelRequest);

    this.login();
    */
  }

  stepTwoBack(): void {
    this.extraTextCheck = '';
    this.mnemonicCheck = '';
    this.stepNum = 1;
  }

  login(): void {
    this.identityService.login({
      channels: this.accountService.getChannels(),
      accountNameAdded: this.accountNameAdded,
      signedUp: true,
    });
  }

  clickTos(): void {
    const h = 700;
    const w = 600;
    const y = window.outerHeight / 2 + window.screenY - h / 2;
    const x = window.outerWidth / 2 + window.screenX - w / 2;

    window.open(`https://${environment.nodeHostname}/tos`, '', `toolbar=no, width=${w}, height=${h}, top=${y}, left=${x}`);
  }

  ////// ENTROPY //////

  checkMnemonic(): void {
    this.showMnemonicError = !this.entropyService.isValidMnemonic(this.entropyService.temporaryEntropy.mnemonic);
    if (this.showMnemonicError) { return; }

    // Convert the mnemonic into new entropy hex.
    const entropy = bip39.mnemonicToEntropy(this.entropyService.temporaryEntropy.mnemonic);
    this.entropyService.temporaryEntropy.customEntropyHex = entropy.toString();
  }

  checkEntropyHex(): void {
    this.showEntropyHexError = !this.entropyService.isValidCustomEntropyHex(this.entropyService.temporaryEntropy.customEntropyHex);
    if (this.showEntropyHexError) { return; }

    // Convert entropy into new mnemonic.
    const entropy = new Buffer(this.entropyService.temporaryEntropy.customEntropyHex, 'hex');
    this.entropyService.temporaryEntropy.mnemonic = bip39.entropyToMnemonic(entropy);
  }

  normalizeExtraText(): void {
    this.entropyService.temporaryEntropy.extraText = this.entropyService.temporaryEntropy.extraText.normalize('NFKD');
  }

  hasEntropyError(): boolean {
    return this.showEntropyHexError || this.showMnemonicError;
  }

  getNewEntropy(): void {
    this.entropyService.setNewTemporaryEntropy();
  }
}
