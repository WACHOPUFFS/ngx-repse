import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings.component';

import { UploadLogoComponent } from './my-company/upload-logo/upload-logo.component';
import { CodeCompanyComponent } from './my-company/code-company/code-company.component';
import { DepartmentManagementComponent } from './my-company/department-management/department-management.component';
import { InitialPeriodsComponent } from './my-company/initial-periods/initial-periods.component';
import { PeriodConfigurationComponent } from './my-company/period-configuration/period-configuration.component';
import { PeriodManagementComponent } from './my-company/period-management/period-management.component';
import { CompanyTaxDetailsComponent } from './my-company/company-tax-details/company-tax-details.component';
import { AnualUploadComponent } from './my-company/anual-upload/anual-upload.component';
import { AnualReviewComponent } from './my-company/anual-review/anual-review.component';
import { CompanyPermissionsSectionsComponent } from './site/company-permissions-sections/company-permissions-sections.component';
import { PermissionsSectionsComponent } from './permissions-sections/permissions-sections.component';
import { RegisterComponent } from './users/register/register.component';
import { MyUsersComponent } from './users/my-users/my-users.component';
import { MyProfileComponent } from './users/my-profile/my-profile.component';
import { CompaniesInfoComponent } from './site/companies-info/companies-info.component';
import { RegCompanyComponent } from './site/reg-company/reg-company.component';
import { PremiumAuthComponent } from './site/premium-auth/premium-auth.component';
import { CpAuthComponent } from './business-partner/cp-auth/cp-auth.component';
import { EditRolesComponent } from './business-partner/edit-roles/edit-roles.component';
import { BusinessPartnerRegisterComponent } from './business-partner/business-partner-register/business-partner-register.component';
import { PermissionsBusineesPartnerComponent } from './business-partner/permissions-businees-partner/permissions-businees-partner.component';
const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: 'my-company/upload-logo',
        component: UploadLogoComponent,
      },
      {
        path: 'my-company/code-company',
        component: CodeCompanyComponent,
      },
      {
        path: 'my-company/department-management',
        component: DepartmentManagementComponent,
      },
      {
        path: 'my-company/initial-periods',
        component: InitialPeriodsComponent,
      },
      {
        path: 'my-company/period-configuration',
        component: PeriodConfigurationComponent,
      },
      {
        path: 'my-company/period-management',
        component: PeriodManagementComponent
      },
      {
        path: 'my-company/company-tax-details',
        component: CompanyTaxDetailsComponent
      },
      {
        path: 'my-company/anual-review',
        component: AnualReviewComponent
      },

      {
        path: 'my-company/anual-upload',
        component: AnualUploadComponent
      },

      //user permissions 
      {
        path: 'permissions-sections',
        component: PermissionsSectionsComponent
      },

      // business partners settings
      {
        path: 'business-partner/cp-auth',
        component: CpAuthComponent,
      },
      {
        path: 'business-partner/edit-roles',
        component: EditRolesComponent,
      },
      {
        path: 'business-partner/business-partner-register',
        component: BusinessPartnerRegisterComponent,
      },
      {
        path: 'business-partner/permissions-businees-partner',
        component: PermissionsBusineesPartnerComponent,
      },


      //site routes
      {
        path: 'site/company-permissions-sections',
        component: CompanyPermissionsSectionsComponent
      },
      {
        path: 'site/companies-info',
        component: CompaniesInfoComponent
      },
      {
        path: 'site/reg-company',
        component: RegCompanyComponent
      },
      {
        path: 'site/premium-auth',
        component: PremiumAuthComponent
      },


      //user routes
      {
        path: 'users/register',
        component: RegisterComponent
      },
      {
        path: 'users/my-users',
        component: MyUsersComponent
      },
      {
        path: 'users/my-profile',
        component: MyProfileComponent
      }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {
}
