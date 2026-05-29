import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth-guard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { InternshipsComponent } from './components/internships/internships';
import { FeedbackComponent } from './components/feedback/feedback';
import { LoginComponent } from './components/login/login';
import { ProfileComponent } from './components/profile/profile';
import { RegisterComponent } from './components/register/register';
import { ShellComponent } from './components/shell/shell';
import { StudyMaterialsComponent } from './components/study-materials/study-materials';
import { feedbackResolver } from './resolvers/feedback-resolver';
import { internshipsResolver } from './resolvers/internships-resolver';
import { profileResolver } from './resolvers/profile-resolver';
import { studyMaterialsResolver } from './resolvers/study-materials-resolver';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [guestGuard]
    },
    {
        path: '',
        component: ShellComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'internships',
                component: InternshipsComponent,
                canActivate: [authGuard],
                resolve: { internshipsData: internshipsResolver }
            },
            {
                path: 'profile',
                component: ProfileComponent,
                canActivate: [authGuard],
                resolve: { profile: profileResolver }
            },
            {
                path: 'study-materials',
                component: StudyMaterialsComponent,
                canActivate: [authGuard],
                resolve: { studyMaterialsData: studyMaterialsResolver }
            },
            {
                path: 'study-materials/:id',
                component: StudyMaterialsComponent,
                canActivate: [authGuard],
                resolve: { studyMaterialsData: studyMaterialsResolver }
            },
            {
                path: 'feedback',
                component: FeedbackComponent,
                canActivate: [authGuard],
                resolve: { feedbackData: feedbackResolver }
            },
            {
                path: 'admin/dashboard',
                component: AdminDashboardComponent,
                canActivate: [authGuard],
                data: { roles: ['Admin'] }
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
