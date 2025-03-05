import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { CompanyService } from '../../../../services/company.service';
import { CpAuthModalDeleteComponent } from '../cp-auth-modal-delete/cp-auth-modal-delete.component';
import { CpAuthModalComponent } from '../cp-auth-modal/cp-auth-modal.component';

@Component({
  selector: 'ngx-cp-auth',
  templateUrl: './cp-auth.component.html',
  styleUrls: ['./cp-auth.component.scss']
})
export class CpAuthComponent implements OnInit {
  socios: any[] = []; // Arreglo para almacenar los socios comerciales no confirmados
  selectedSocio: any;

  // Etiquetas para los textos en la vista
  labelAutorizarSocioComercial: string;
  labelSeleccioneSocioComercial: string;
  labelDetallesSocioComercial: string;
  buttonAceptarSocio: string;
  buttonRechazarSocio: string;
  labelNombreEmpresa: string;
  labelRFC: string;
  labelRolComo: string;
  labelFechaInicioPeriodo: string;
  labelFechaFinPeriodo: string;

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private companyService: CompanyService,
  ) {}

  ngOnInit() {
    // Llamar a la función para obtener los socios comerciales no confirmados al inicializar el componente
    this.obtenerSociosNoConfirmados();
  }

  obtenerSociosNoConfirmados() {
    const selectedCompanyId = this.companyService.selectedCompany.id;
    const userId = this.authService.userId; // Obtener el userId del usuario actual del servicio AuthService
  
    if (selectedCompanyId && userId) {
      this.http.get<any>(`https://siinad.mx/php/get_cp_auth.php?id=${selectedCompanyId}&user_id=${userId}`)
        .subscribe((data: any) => {
          if (Array.isArray(data)) {
            this.socios = data; // Si `data` es un array, lo asignamos directamente
          } else if (data.mensaje) {
            this.socios = []; // Si hay un mensaje, no hay socios
            console.warn(data.mensaje);
          } else {
            this.socios = [data]; // Si es un solo objeto, conviértelo en un array
          }
        });
    }
  }

  getSocioDetails() {
    console.log('Detalles del socio seleccionado:', this.selectedSocio);
  }

  aceptarSocio() {
    const data = {
      userId: this.authService.userId,
      companyId: this.companyService.selectedCompany.id,
      associationId: this.selectedSocio.id
    };
  
    this.http.post<any>('https://siinad.mx/php/update_verified.php', data)
      .subscribe(async (response: any) => {
        if (response.success) {
          console.log('Socio aceptado con éxito');
          this.socios = this.socios.filter(socio => socio.id !== this.selectedSocio.id);
          this.selectedSocio = null;
  
          // Usar el diálogo de Nebular para mostrar el modal
          this.dialogService.open(CpAuthModalComponent, {
            context: { continuarRegistro: false }, // Ahora válido
          }).onClose.subscribe((data) => {
            if (data?.continuarRegistro) {
              // Acción adicional si se selecciona continuar el registro
            } else {
              this.router.navigate(['/home']);
            }
          });
        } else {
          this.mostrarToast(response.message, 'danger');
        }
      }, (error) => {
        console.error('Error al aceptar al socio:', error);
      });
  }
  

  rechazarSocio() {
    this.presentModal();
  }

  presentModal() {
    this.dialogService.open(CpAuthModalDeleteComponent, {
      context: {
        continuarRegistro: false,
        mostrarMotivoRechazo: true,
      },
    }).onClose.subscribe((motivoRechazo: string) => {
      if (motivoRechazo) {
        this.confirmarRechazoSocio(motivoRechazo);
      }
    });
  }

  confirmarRechazoSocio(motivo: string) {
    const data = {
      associationId: this.selectedSocio.id,
      companyId: this.companyService.selectedCompany.id,
      motivo: motivo
    };

    this.http.post<any>('https://siinad.mx/php/delete_association.php', data)
      .subscribe((response: any) => {
        this.mostrarToast(response.message, 'success');
        this.socios = this.socios.filter(socio => socio.id !== this.selectedSocio.id);
        this.selectedSocio = null;
      }, (error) => {
        console.error('Error al rechazar al socio:', error);
      });
  }

  mostrarToast(mensaje: string, status: string) {
    this.toastrService.show(mensaje, 'Notificación', { status });
  }

  getRoleDisplayName(roleName: string): string {
    if (roleName === 'proveedor') {
      return 'Proveedor';
    } else if (roleName === 'cliente') {
      return 'Cliente';
    } else if (roleName === 'clienteProveedor') {
      return 'Cliente - Proveedor';
    } else {
      return roleName; // Por si hay algún otro rol no considerado
    }
  }

  goBack() {
    this.router.navigate(['/previous']); // Cambiar navegación según sea necesario
  }
}
