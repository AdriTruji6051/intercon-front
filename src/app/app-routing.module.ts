import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BillComponent } from './dashboard/bill/bill.component';
import { ProductsComponent } from './dashboard/products/products.component';
import { TicketsComponent } from './dashboard/tickets/tickets.component';
import { AuthGuard } from './guards/auth.guard';
import { AdvancedOptionsComponent } from './advanced-options/advanced-options.component';
import { ConnerAIDashboardComponent } from './advanced-options/conner-ai-dashboard/conner-ai-dashboard.component';
import { AdminGuard } from './guards/admin.guard';
import { StatisticsComponent } from './advanced-options/statistics/statistics.component';




const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      {path: '', component: BillComponent},
      {path: 'bill', component: BillComponent},
      {path: 'products', component: ProductsComponent},
      {path: 'ticket', component: TicketsComponent},
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      {path: '', component: BillComponent},
      {path: 'bill', component: BillComponent},
      {path: 'products', component: ProductsComponent},
      {path: 'ticket', component: TicketsComponent},
      {path: 'advanced', component: StatisticsComponent /*AdvancedOptionsComponent*/ },
      {path: 'advanced/conner', component: ConnerAIDashboardComponent},
      {path: 'advanced/statistics', component: StatisticsComponent},
    ],
    canActivate: [AdminGuard]
  },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
