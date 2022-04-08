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
import {CookieModule} from 'ngx-cookie';
import { LogoutComponent } from './logout/logout.component';
import { BannerComponent } from './banner/banner.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import {AccountService} from './account.service';
import {EntropyService} from './entropy.service';
import { LogInComponent } from './log-in/log-in.component';
import {HttpClientModule} from '@angular/common/http';
import { ApproveComponent } from './approve/approve.component';
import { LoadSeedComponent } from './load-seed/load-seed.component';
import { ErrorCallbackComponent } from './error-callback/error-callback.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TestSignComponent } from './test-sign/test-sign.component';
import { TestSignTransactionComponent } from './test-sign-transaction/test-sign-transaction.component';
import { TestLbryLogInComponent } from './test-lbry-log-in/test-lbry-log-in.component'

@NgModule({
  declarations: [
    AppComponent,
    EmbedComponent,
    HomeComponent,
    LogoutComponent,
    BannerComponent,
    SignUpComponent,
    LogInComponent,
    ApproveComponent,
    LoadSeedComponent,
    ErrorCallbackComponent,
    TestSignComponent,
    TestSignTransactionComponent,
    TestLbryLogInComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgxIntlTelInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    CookieModule.forRoot()
  ],
  providers: [
    IdentityService,
    EntropyService,
    AccountService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
