import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { SpendLBCComponent } from "./spend-lbc/spend-lbc.component";

const routes: Routes = [
  { path: "", component: SpendLBCComponent, pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
class AppRoutingModule {}

export { AppRoutingModule };
