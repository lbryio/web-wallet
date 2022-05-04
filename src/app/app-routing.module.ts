import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TestSignComponent} from './test-sign/test-sign.component';
import {TestLbryLogInComponent} from './test-lbry-log-in/test-lbry-log-in.component';
import {TestSignTransactionComponent} from './test-sign-transaction/test-sign-transaction.component';
import {EmbedComponent} from './embed/embed.component';
import {HomeComponent} from './home/home.component';
import {LogoutComponent} from './logout/logout.component';
import {SignUpComponent} from './sign-up/sign-up.component';
import {LogInComponent} from './log-in/log-in.component';
import {ApproveComponent} from './approve/approve.component';

export class RouteNames {
  public static TEST_SIGN = 'test-sign';
  public static TEST_LBRY_LOG_IN = 'test-lbry-log-in';
  public static TEST_SIGN_TRANSACTION = 'test-sign-transaction';
  public static EMBED = 'embed';
  public static LOGOUT = 'logout';
  public static SIGN_UP = 'sign-up';
  public static LOG_IN = 'log-in';
  public static APPROVE = 'approve';
}

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: RouteNames.TEST_SIGN, component: TestSignComponent, pathMatch: 'full' },
  { path: RouteNames.TEST_LBRY_LOG_IN, component: TestLbryLogInComponent, pathMatch: 'full' },
  { path: RouteNames.TEST_SIGN_TRANSACTION, component: TestSignTransactionComponent, pathMatch: 'full' },
  { path: RouteNames.EMBED, component: EmbedComponent, pathMatch: 'full' },
  { path: RouteNames.LOGOUT, component: LogoutComponent, pathMatch: 'full' },
  { path: RouteNames.SIGN_UP, component: SignUpComponent, pathMatch: 'full' },
  { path: RouteNames.LOG_IN, component: LogInComponent, pathMatch: 'full' },
  { path: RouteNames.APPROVE, component: ApproveComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
