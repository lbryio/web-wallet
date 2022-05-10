import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EmbedComponent } from './embed/embed.component';
import { HomeComponent } from './home/home.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IdentityService} from './identity.service';
import { LogoutComponent } from './logout/logout.component';
import { BannerComponent } from './banner/banner.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import {AccountService} from './account.service';
import {EntropyService} from './entropy.service';
import { LogInAppComponent } from './log-in-app/log-in-app.component';
import {HttpClientModule} from '@angular/common/http';
import { ApproveComponent } from './approve/approve.component';
import { ErrorCallbackComponent } from './error-callback/error-callback.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TestSignComponent } from './test-sign/test-sign.component';
import { TestSignTransactionComponent } from './test-sign-transaction/test-sign-transaction.component';
import { LogInWalletComponent } from './log-in-wallet/log-in-wallet.component'

@NgModule({
  declarations: [
    AppComponent,
    EmbedComponent,
    HomeComponent,
    LogoutComponent,
    BannerComponent,
    SignUpComponent,
    LogInAppComponent,
    ApproveComponent,
    ErrorCallbackComponent,
    TestSignComponent,
    TestSignTransactionComponent,
    LogInWalletComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  providers: [
    IdentityService,
    EntropyService,
    AccountService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
