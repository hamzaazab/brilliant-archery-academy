import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { AboutComponent } from './pages/about/about.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { BranchesComponent } from './pages/branches/branches.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { TournamentsComponent } from './pages/tournaments/tournaments.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'home' },
	{ path: 'home', component: HomeComponent },
	{ path: 'about', component: AboutComponent },
	{ path: 'ranking', component: RankingComponent },
	{ path: 'branches', component: BranchesComponent },
	{ path: 'tournaments', component: TournamentsComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'admin/users', component: AdminUsersComponent, canActivate: [adminGuard] },
	{ path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
	{ path: '**', redirectTo: 'home' }
];
