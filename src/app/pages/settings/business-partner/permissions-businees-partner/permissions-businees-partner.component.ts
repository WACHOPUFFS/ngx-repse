/*
  En esta parte se manejan los permisos de tus socios comerciales para ver ciertas secciones 
*/
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyService } from '../../../../services/company.service';
import { Router } from '@angular/router';
import { CustomToastrService } from '../../../../services/custom-toastr.service';
import { AuthService } from '../../../../services/auth.service';
import { LoadingController } from '@ionic/angular'; // Importar LoadingController

@Component({
  selector: 'ngx-permissions-businees-partner',
  templateUrl: './permissions-businees-partner.component.html',
  styleUrls: ['./permissions-businees-partner.component.scss']
})
export class PermissionsBusineesPartnerComponent implements OnInit {
  selectedUserType: string = 'all';
  selectedUserId: string;
  selectedSection: string;
  selectedSubSections: string[] = [];
  selectedSubSectionsProvider: string[] = []; // Nueva propiedad para proveedor
  selectedSubSectionsClient: string[] = []; // Nueva propiedad para cliente
  users: any[] = [];
  filteredUsers: any[] = [];
  userTypes: any[] = [];
  sections: string[] = [];
  subSections: string[] = [];
  subSectionsProvider: string[] = []; // Nueva propiedad para proveedor
  subSectionsClient: string[] = []; // Nueva propiedad para cliente
  permissions: any[] = [];

  commercialPartners: any[] = [];
  selectedPartnerId: string;

  userTypeNames: Record<string, string> = {
    admin: 'Administrador',
    superV: 'Supervisor',
    adminU: 'Administrativo'
  };

  groupedPermissions: { section: string, subSections: string[] }[] = []; // Nueva propiedad

  constructor(
    private http: HttpClient,
    private toastrService: CustomToastrService,
    public companyService: CompanyService,
    private router: Router,
    public authService: AuthService,
    private loadingController: LoadingController // Inyectar LoadingController
  ) { }

  async ngOnInit() {
    await this.loadUsers();
    await this.loadUserTypes();
    await this.loadSections();
    await this.loadCommercialPartners(); // Cargar socios comerciales
  }



  async loadCommercialPartners() {
    const loading = await this.showLoading('Cargando socios comerciales...');
    const companyId = this.companyService.selectedCompany.id;

    this.http.post('https://siinad.mx/php/getCommercialPartners.php', { companyId })
      .subscribe(
        async (response: any) => {
          if (response.success) {
            this.commercialPartners = response.partners;
          } else {
            this.toastrService.showError(response.error, 'error');
          }
          await loading.dismiss();
        },
        async (error) => {
          console.error('Error:', error);
          this.toastrService.showError('Error al cargar socios', 'error');
          await loading.dismiss();
        }
      );
  }

  async loadUsers() {
    const loading = await this.showLoading('Cargando usuarios...'); // Mostrar loading
    const companyId = this.companyService.selectedCompany.id;
    const data = { companyId: companyId };

    this.http.post('https://siinad.mx/php/searchUsers.php', data).subscribe(
      async (response: any) => {
        if (response.success) {
          this.users = response.employees;
          this.filteredUsers = this.users;
        } else {
          this.toastrService.showError(response.error, 'error');
        }
        await loading.dismiss(); // Ocultar loading
      },
      async (error) => {
        console.error('Error en la solicitud GET:', error);
        this.toastrService.showError('Error al cargar usuarios.', 'error');
        await loading.dismiss(); // Ocultar loading
      }
    );
  }

  async loadUserTypes() {
    const loading = await this.showLoading('Cargando tipos de usuario...'); // Mostrar loading
    this.http.get('https://siinad.mx/php/get-level-users.php').subscribe(
      async (response: any) => {
        this.userTypes = response;
        await loading.dismiss(); // Ocultar loading
      },
      async (error) => {
        console.error('Error en la solicitud GET:', error);
        this.toastrService.showError('Error al cargar los tipos de usuario.', 'error');
        await loading.dismiss(); // Ocultar loading
      }
    );
  }

  async loadSections(partnerId?: string) {
    const loading = await this.showLoading('Cargando secciones...');
    const data = {
      companyId: this.companyService.selectedCompany.id,
      partnerId: partnerId || null
    };

    this.http.post('https://siinad.mx/php/loadCompanySections.php', data)
      .subscribe(
        async (response: any) => {
          if (response.success) {
            const allSections = [...]; // Mantener tu lista de secciones
            const assignedSections = response.sections.map(s => s.NameSection);
            this.sections = allSections.filter(s => assignedSections.includes(s));

            // Copiar secciones si es un nuevo socio
            if (partnerId && response.copySuccess) {
              this.toastrService.showSuccess('Secciones copiadas correctamente', 'éxito');
            }
          }
          await loading.dismiss();
        },
        async (error) => {
          console.error('Error:', error);
          this.toastrService.showError('Error al cargar secciones', 'error');
          await loading.dismiss();
        }
      );
  }

  async onPartnerSelected(event: any) {
    this.selectedPartnerId = event.detail.value;
    await this.loadSections(this.selectedPartnerId);
    
    // Opcional: Cargar usuarios del socio
    if (this.selectedPartnerId) {
      await this.loadPartnerUsers(this.selectedPartnerId);
    }
  }

  async loadPartnerUsers(partnerId: string) {
    const loading = await this.showLoading('Cargando usuarios...');
    this.http.post('https://siinad.mx/php/getPartnerUsers.php', { partnerId })
      .subscribe(
        async (response: any) => {
          if (response.success) {
            this.users = response.users;
            this.filteredUsers = this.users;
          }
          await loading.dismiss();
        },
        async (error) => {
          console.error('Error:', error);
          this.toastrService.showError('Error al cargar usuarios', 'error');
          await loading.dismiss();
        }
      );
  }

  async onUserTypeChange(event: any) {
    const userType = event.target.value;

    if (userType === 'all') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user => user.role === userType);
    }
  }

  async onUserChange(selectedValue: any) {
    this.selectedUserId = selectedValue;
    await this.loadPermissions();
  }

  async onSectionChange(selectedValue: any) {
    this.selectedSection = selectedValue;
    this.loadSubSections(this.selectedSection);
  }

  async loadSubSections(section: string) {
    const subSectionsMap: { [key: string]: string[] } = {
      'Sistema REPSE': [''],
      'Control de proyectos': [
        'Asignacion de proyectos',
        'Registro de proyectos',
        'Vizualizar proyectos',
        'Seguimiento de proyectos'
      ],
      'Empleados': [
        'Registrar solicitudes de empleados',
        'Editar solicitudes de empleados',
        'Aceptar solicitudes de empleados',
        'Procesar empleados',
        'Ver empleados registrados'
      ],
      'Incidencias': [
        'Control de incidencias',
        'Confirmar dia',
        'Confirmar semana',
        'Semanas procesadas',
        'Lista de asistencia'
      ],
      'Costos': [''],
      'Ventas': [''],
      'Configuracion de mi empresa': [
        'Asignar logo de la empresa',
        'Código de la empresa',
        'Departamentos',
        'Configuración inicial de períodos',
        'Tipos de período',
        'Catálogo de períodos',
        'Mi informacion fiscal',
        'Confirmar expendientes digitales',
        'Subir expendientes digitales'
      ],
      'Configuracion de socios comerciales': [
        'Autorizar socio comercial',
        'Editar roles de los socios comerciales',
        'Registrar socio comercial',
        'Secciones visibles de los socios comerciales'
      ],
      'Configuracion de sitio': [
        'Secciones visibles de empresas',
        'Empresas registradas en la página',
        'Registrar empresas',
        'Confirmar solicitudes premium'
      ],
      'Configuracion de usuarios': [
        'Registrar usuarios',
        'Mis usuarios',
        'Editar mi usuario'
      ],
    };

    const subSectionsProviderMap: { [key: string]: string[] } = {
      'Sistema REPSE': [''],
      'Control de proyectos': [
        'Asignacion de proyectosSDASDSAS',
        'Registro de proyectos',
        'Vizualizar proyectos',
        'Seguimiento de proyectos'
      ],
      'Empleados': ['Registrar solicitudes de empleados', 'editar solicitudes de empleados', 'Ver empleados registrados'],
      'Incidencias': ['Control de incidencias', 'Confirmar dia', 'Confirmar semana', 'Semanas procesadas', 'Lista de asistencia'],
      'Costos': [''],
      'Ventas': [''],
      'Configuracion de mi empresa': [
        'Asignar logo de la empresa',
        'Código de la empresa',
        'Departamentos',
        'Configuración inicial de períodos',
        'Tipos de período',
        'Catálogo de períodos'
      ],
      'Configuracion de perfiles': [''],
      'Configuracion de socios comerciales': [
        'Autorizar socio comercial',
        'Editar roles de los socios comerciales',
        'Registrar socio comercial',
        'Secciones visibles de los socios comerciales'
      ],
      'Configuracion de sitio': [
        'Secciones visibles de empresas',
        'Empresas registradas en la página',
        'Registrar empresas',
        'Confirmar solicitudes premium'
      ],
      'Configuracion de usuarios': [
        'Registrar, eliminar, ver y editar usuarios',
        'Editar mi usuario'
      ],
    };

    const subSectionsClientMap: { [key: string]: string[] } = {
      'Sistema REPSE': [''],
      'Control de proyectos': [
        'Asignacion de proyectoCXVVXXVCVXCs',
        'Registro de proyectos',
        'Vizualizar proyectos',
        'Seguimiento de proyectos'
      ],
      'Empleados': ['Registrar solicitudes de empleados', 'editar solicitudes de empleados', 'Ver empleados registrados'],
      'Incidencias': ['Control de incidencias', 'Confirmar dia', 'Confirmar semana', 'Semanas procesadas', 'Lista de asistencia'],
      'Costos': [''],
      'Ventas': [''],
      'Configuracion de mi empresa': [
        'Asignar logo de la empresa',
        'Código de la empresa',
        'Departamentos',
        'Configuración inicial de períodos',
        'Tipos de período',
        'Catálogo de períodos'
      ],
      'Configuracion de perfiles': [''],
      'Configuracion de socios comerciales': [
        'Autorizar socio comercial',
        'Editar roles de los socios comerciales',
        'Registrar socio comercial',
        'Secciones visibles de los socios comerciales'
      ],
      'Configuracion de sitio': [
        'Secciones visibles de empresas',
        'Empresas registradas en la página',
        'Registrar empresas',
        'Confirmar solicitudes premium'
      ],
      'Configuracion de usuarios': [
        'Registrar, eliminar, ver y editar usuarios',
        'Editar mi usuario'
      ],
    };

    this.subSections = subSectionsMap[section] || [];

    if (this.companyService.selectedCompany.role === 'proveedor') {
      this.subSectionsProvider = subSectionsProviderMap[section] || [];
    } else if (this.companyService.selectedCompany.role === 'cliente') {
      this.subSectionsClient = subSectionsClientMap[section] || [];
    }
  }

  async loadPermissions() {
    const loading = await this.showLoading('Cargando permisos...'); // Mostrar loading
    const companyId = this.companyService.selectedCompany.id;
    const data = { userId: this.selectedUserId, companyId: companyId };

    this.http.post('https://siinad.mx/php/loadPermissions.php', data).subscribe(
      async (response: any) => {
        if (response.success) {
          this.permissions = response.permissions;
          this.groupPermissions(); // Agrupa los permisos después de cargarlos
        } else {
          console.error(response.error);
          await this.toastrService.showError(response.error, 'error');
        }
        await loading.dismiss(); // Ocultar loading
      },
      async (error) => {
        console.error('Error en la solicitud POST:', error);
        await this.toastrService.showError('Error al cargar permisos.', 'error');
        await loading.dismiss(); // Ocultar loading
      }
    );
  }

  groupPermissions() {
    const grouped: { [key: string]: string[] } = {};

    this.permissions.forEach(permission => {
      if (!grouped[permission.section]) {
        grouped[permission.section] = [];
      }
      grouped[permission.section].push(permission.subSection || 'Sin subapartado');
    });

    this.groupedPermissions = Object.keys(grouped).map(section => ({
      section,
      subSections: grouped[section]
    }));
  }

  async addPermission() {
    const loading = await this.showLoading('Agregando permisos...'); // Mostrar loading
    const companyId = this.companyService.selectedCompany.id;
    let selectedSubSections: string[] = [];

    if (this.companyService.selectedCompany.Role === 'proveedor') {
      selectedSubSections = this.selectedSubSectionsProvider;
    } else if (this.companyService.selectedCompany.Role === 'cliente') {
      selectedSubSections = this.selectedSubSectionsClient;
    } else {
      selectedSubSections = this.selectedSubSections;
    }

    // Validar si los permisos ya existen
    const existingPermissions = this.checkExistingPermissions(this.selectedSection, selectedSubSections);
    if (existingPermissions.length > 0) {
      this.toastrService.showError(`Los siguientes permisos ya existen: ${existingPermissions.join(', ')}`, 'error');
      await loading.dismiss(); // Ocultar loading
      return; // Detener el proceso si hay permisos duplicados
    }

    const data = {
      userId: this.selectedUserId,
      section: this.selectedSection,
      subSections: selectedSubSections,
      companyId: companyId
    };

    this.http.post('https://siinad.mx/php/addPermission.php', data).subscribe(
      async (response: any) => {
        if (response.success) {
          selectedSubSections.forEach((subSection: string) => {
            this.permissions.push({ section: this.selectedSection, subSection: subSection });
          });
          this.groupPermissions(); // Actualiza la agrupación
          this.toastrService.showSuccess('Permisos agregados correctamente.', 'exito');
        } else {
          console.error(response.error);
          await this.toastrService.showError(response.error, 'error');
        }
        await loading.dismiss(); // Ocultar loading
      },
      async (error) => {
        console.error('Error en la solicitud POST:', error);
        await this.toastrService.showError('Error al añadir permiso.', 'danger');
        await loading.dismiss(); // Ocultar loading
      }
    );
  }

  async removePermission(section: string, subSection: string) {

    const loading = await this.showLoading('Eliminando permiso...');

    const companyId = this.companyService.selectedCompany.id;
    const data = {
      userId: this.selectedUserId,
      section: section,

      subSection: subSection,
      companyId: companyId
    };


    this.http.post('https://siinad.mx/php/removePermission.php', data).subscribe(
      async (response: any) => {
        if (response.success) {
          this.permissions = this.permissions.filter(p => !(p.section === section && p.subSection === subSection));

          this.groupPermissions();

          this.toastrService.showSuccess('Permiso eliminado correctamente.', 'Exito');
        } else {
          console.error(response.error);
          await this.toastrService.showError(response.error, 'error');
        }

        await loading.dismiss();

      },
      async (error) => {
        console.error('Error en la solicitud POST:', error);
        await this.toastrService.showError('Error al eliminar permiso.', 'error');
        await loading.dismiss();

      }
    );
  }

  // Función para mostrar el loading
  async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent', // Puedes cambiar el tipo de spinner
      translucent: true,
    });
    await loading.present();
    return loading;
  }

  // Función para verificar si los permisos ya existen
  checkExistingPermissions(section: string, subSections: string[]): string[] {
    const existingPermissions: string[] = [];

    subSections.forEach(subSection => {
      const exists = this.permissions.some(
        permission => permission.section === section && permission.subSection === subSection
      );
      if (exists) {
        existingPermissions.push(subSection);
      }
    });

    return existingPermissions;
  }
}