/*
  En esta parte se manejan los permisos de tus socios comerciales para ver ciertas secciones 
*/
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyService } from '../../../../services/company.service';
import { Router } from '@angular/router';
import { CustomToastrService } from '../../../../services/custom-toastr.service';

@Component({
  selector: 'ngx-permissions-businees-partner',
  templateUrl: './permissions-businees-partner.component.html',
  styleUrls: ['./permissions-businees-partner.component.scss']
})
export class PermissionsBusineesPartnerComponent implements OnInit {
  sociosComerciales: any[] = [];
  seccionesDisponibles: string[] = [];
  socioComercialSeleccionado: any = null;
  permisosSeleccionados: string[] = [];
  permisosActuales: any[] = [];

  constructor(
    private http: HttpClient,
    private toastrService: CustomToastrService,
    private companyService: CompanyService,
    private router: Router
  ) { }

  ngOnInit() {
    this.obtenerSociosComerciales();
  }

  obtenerSociosComerciales() {
    const data = { association_id: this.companyService.selectedCompany.id };
    this.http.get('https://siinad.mx/php/getBusinessPartner.php', { params: data }).subscribe(
      (response: any) => {
        if (response.length > 0) {
          this.sociosComerciales = response;
        } else {
          this.toastrService.showWarning('No se encontraron socios comerciales.', 'warning');
        }
      },
      (error) => {
        console.error('Error al cargar socios comerciales:', error);
        this.toastrService.showError('Error al cargar socios comerciales.', 'danger');
      }
    );
  }

  mostrarDatosSocioComercial() {
    this.socioComercialSeleccionado = this.sociosComerciales.find(
      socio => socio.businessPartnerId === this.socioComercialSeleccionado.businessPartnerId
    );

    if (this.socioComercialSeleccionado) {
      // Determinar las secciones disponibles según el rol del socio comercial
      switch (this.socioComercialSeleccionado.roleName) {
        case 'cliente':
          this.seccionesDisponibles = ['Sistema REPSE', 'Control de proyectos', 'Empleados'];
          break;
        case 'proveedor':
          this.seccionesDisponibles = ['Incidencias', 'Costos', 'Ventas'];
          break;
        case 'clienteProveedor':
          this.seccionesDisponibles = [
            'Sistema REPSE', 'Control de proyectos', 'Empleados', 'Incidencias', 'Costos', 'Ventas'
          ];
          break;
        default:
          this.seccionesDisponibles = [];
      }

      this.cargarPermisos();
    }
  }

  cargarPermisos() {
    const data = { businessPartnerId: this.socioComercialSeleccionado.businessPartnerId };
    this.http.post('https://siinad.mx/php/loadBusinessSections.php', data).subscribe(
      (response: any) => {
        if (response.success) {
          this.permisosActuales = response.sections;
        } else {
          this.toastrService.showError(response.error || 'Error al cargar permisos.', 'danger');
        }
      },
      (error) => {
        console.error('Error al cargar permisos:', error);
        this.toastrService.showError('Error al cargar permisos.', 'danger');
      }
    );
  }

  agregarPermisos() {
    const data = {
      businessPartnerId: this.socioComercialSeleccionado.businessPartnerId,
      companyId: this.companyService.selectedCompany.id,
      sections: this.permisosSeleccionados
    };

    this.http.post('https://siinad.mx/php/addBusinessSections.php', data).subscribe(
      (response: any) => {
        if (response.success) {
          this.toastrService.showSuccess('Permisos añadidos correctamente.', 'success');
          this.cargarPermisos(); // Refresca los permisos actuales
        } else {
          this.toastrService.showError(response.error || 'Error al añadir permisos.', 'danger');
        }
      },
      (error) => {
        console.error('Error al añadir permisos:', error);
        this.toastrService.showError('Error al añadir permisos.', 'danger');
      }
    );
  }

  eliminarPermiso(section: string) {
    const data = {
      businessPartnerId: this.socioComercialSeleccionado.businessPartnerId,
      section
    };

    this.http.post('https://siinad.mx/php/removeBusinessSections.php', data).subscribe(
      (response: any) => {
        if (response.success) {
          this.toastrService.showSuccess('Permiso eliminado correctamente.', 'success');
          this.cargarPermisos(); // Refresca los permisos actuales
        } else {
          this.toastrService.showError(response.error || 'Error al eliminar permiso.', 'danger');
        }
      },
      (error) => {
        console.error('Error al eliminar permiso:', error);
        this.toastrService.showError('Error al eliminar permiso.', 'danger');
      }
    );
  }
}
