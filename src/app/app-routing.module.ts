import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TestSignComponent} from './test-sign/test-sign.component';
import {LogInWalletComponent} from './log-in-wallet/log-in-wallet.component';
import {TestSignTransactionComponent} from './test-sign-transaction/test-sign-transaction.component';
import {EmbedComponent} from './embed/embed.component';
import {HomeComponent} from './home/home.component';
import {LogoutComponent} from './logout/logout.component';
import {SignUpComponent} from './sign-up/sign-up.component';
import {LogInAppComponent} from './log-in-app/log-in-app.component';
import {ApproveComponent} from './approve/approve.component';

export class RouteNames {
  public static TEST_SIGN = 'test-sign';
  public static LOG_IN_WALLET = 'log-in-wallet';
  public static TEST_SIGN_TRANSACTION = 'test-sign-transaction';
  public static EMBED = 'embed';
  public static LOGOUT = 'logout';
  public static SIGN_UP = 'sign-up';
  public static LOG_IN_APP = 'log-in-app';
  public static APPROVE = 'approve';
}

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: RouteNames.TEST_SIGN, component: TestSignComponent, pathMatch: 'full' },
  { path: RouteNames.LOG_IN_WALLET, component: LogInWalletComponent, pathMatch: 'full' },
  { path: RouteNames.TEST_SIGN_TRANSACTION, component: TestSignTransactionComponent, pathMatch: 'full' },
  { path: RouteNames.EMBED, component: EmbedComponent, pathMatch: 'full' },
  { path: RouteNames.LOGOUT, component: LogoutComponent, pathMatch: 'full' },
  { path: RouteNames.SIGN_UP, component: SignUpComponent, pathMatch: 'full' },
  { path: RouteNames.LOG_IN_APP, component: LogInAppComponent, pathMatch: 'full' },
  { path: RouteNames.APPROVE, component: ApproveComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
