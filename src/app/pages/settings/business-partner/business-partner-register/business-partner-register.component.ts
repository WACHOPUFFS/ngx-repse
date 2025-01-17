import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NbToastrService, NbDialogService } from '@nebular/theme';
import { RegistroModalComponent } from '../registro-modal/registro-modal.component';
import { AuthService } from '../../../../services/auth.service';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { CompanyInfoModalComponent } from '../company-info-modal/company-info-modal.component';
import { CompanyService } from '../../../../services/company.service';

@Component({
  selector: 'ngx-business-partner-register',
  templateUrl: './business-partner-register.component.html',
  styleUrls: ['./business-partner-register.component.scss'],
})
export class BusinessPartnerRegisterComponent implements OnInit {
  usuario = {
    nombreUsuario: '',
    nombreCompleto: '',
    correo: '',
    numTelefonico: '',
    contrasena: '',
    confirmarContrasena: '',
    rfc: '',
    roleInCompany: '',
    nombreEmpresa: '',
    fechaInicio: '',
    fechaFin: '',
    empresaLigada: '',
  };

  showMessageFlag: boolean = false;
  tipoRFC: string = 'fisica';
  rfcLengthError: string = '';
  prefijo: string;
  prefijos: { codigo: string; pais: string }[] = [];
  phoneNumberUtil: PhoneNumberUtil;
  telefonoError: string = '';
  codigoSocioComercial: string;
  registerMode: string = 'register';
  rolesDisponibles: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.phoneNumberUtil = PhoneNumberUtil.getInstance();
    this.obtenerPrefijos();
  }

  ngOnInit() {
    this.registerMode = 'register';
    this.obtenerRoles();
  }

  obtenerPrefijos() {
    const regionCodes = this.phoneNumberUtil.getSupportedRegions();
    this.prefijos = regionCodes.map((regionCode) => {
      const countryCode =
        '+' + this.phoneNumberUtil.getCountryCodeForRegion(regionCode);
      const countryName = this.getCountryName(regionCode);
      return { codigo: countryCode, pais: countryName };
    });
    this.prefijos.sort((a, b) => parseInt(a.codigo) - parseInt(b.codigo));
  }

  getCountryName(regionCode: string): string {
    return regionCode;
  }

  async camposCompletos(): Promise<boolean> {
    const regexPuntoCom = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (
      typeof this.usuario.nombreUsuario === 'string' &&
      this.usuario.nombreUsuario.trim() !== '' &&
      typeof this.usuario.nombreCompleto === 'string' &&
      this.usuario.nombreCompleto.trim() !== '' &&
      typeof this.usuario.correo === 'string' &&
      this.usuario.correo.trim() !== '' &&
      typeof this.usuario.numTelefonico === 'string' &&
      this.usuario.numTelefonico.trim() !== '' &&
      typeof this.usuario.contrasena === 'string' &&
      this.usuario.contrasena.trim() !== '' &&
      typeof this.usuario.nombreEmpresa === 'string' &&
      this.usuario.nombreEmpresa.trim() !== '' &&
      typeof this.usuario.roleInCompany === 'string' &&
      this.usuario.roleInCompany.trim() !== '' &&
      this.usuario.correo.includes('@') &&
      regexPuntoCom.test(this.usuario.correo) &&
      this.usuario.contrasena === this.usuario.confirmarContrasena &&
      this.validarTelefono()
    );
  }

  validarTelefono(): boolean {
    const telefonoRegex = /^\d{10}$/;
    if (!telefonoRegex.test(this.usuario.numTelefonico)) {
      this.telefonoError =
        'El número de teléfono debe tener exactamente 10 dígitos numéricos.';
      return false;
    } else {
      this.telefonoError = '';
      return true;
    }
  }

  mostrarToast(mensaje: string, status: 'success' | 'danger' | 'warning') {
    this.toastrService.show(mensaje, 'Notificación', { status });
  }

  async registrarUsuario() {
    if (await this.camposCompletos()) {
      const data = {
        idUser: this.authService.userId,
        nombreUsuario: this.usuario.nombreUsuario,
        nombreCompleto: this.usuario.nombreCompleto,
        correo: this.usuario.correo,
        numTelefonico: this.usuario.numTelefonico,
        contrasena: this.usuario.contrasena,
        rfc: this.usuario.rfc,
        roleInCompany: this.usuario.roleInCompany,
        nombreEmpresa:
          this.tipoRFC === 'fisica'
            ? this.usuario.nombreEmpresa
            : this.tipoRFC === 'moral'
            ? this.usuario.nombreEmpresa
            : null,
        fechaInicio: this.usuario.fechaInicio,
        fechaFin: this.usuario.fechaFin,
        empresaLigada: this.companyService.selectedCompany.id,
      };

      this.http.post('https://siinad.mx/php/registrar.php', data).subscribe(
        async (response: any) => {
          if (response.success) {
            this.mostrarToast(response.message, 'success');

            const dialogRef = this.dialogService.open(RegistroModalComponent, {
              context: { continuarRegistro: false },
            });

            dialogRef.onClose.subscribe((result) => {
              if (result.continuarRegistro) {
                this.limpiarCampos();
              } else {
                this.router.navigate(['/home']);
              }
            });
          } else {
            this.mostrarToast(response.message, 'danger');
          }
        },
        async (error) => {
          console.error('Error en la solicitud POST:', error);
          this.mostrarToast('Error en la solicitud de registro.', 'danger');
        }
      );
    } else {
      this.mostrarToast(
        'Por favor complete todos los campos obligatorios y verifique el correo electrónico y la contraseña.',
        'warning'
      );
    }
  }

  async openUserInfoModal() {
    if (!this.codigoSocioComercial || this.codigoSocioComercial.trim() === '') {
      this.mostrarToast(
        'Código de socio comercial no proporcionado.',
        'warning'
      );
      return;
    }

    const url = `https://siinad.mx/php/load_company_association.php?codigoEmpresa=${this.codigoSocioComercial}`;

    this.http.get(url).subscribe(
      (response: any) => {
        if (response.error) {
          this.mostrarToast(response.error, 'danger');
          return;
        }

        if (!response || response.length === 0) {
          this.mostrarToast(
            'No se encontraron datos de asociación.',
            'warning'
          );
          return;
        }

        this.dialogService.open(CompanyInfoModalComponent, {
          context: { companyData: response },
        });
      },
      (error) => {
        console.error('Error al cargar la asociación:', error);
        this.mostrarToast(
          'Error al cargar la asociación. Inténtalo de nuevo más tarde.',
          'danger'
        );
      }
    );
  }

  goBack() {
    this.router.navigate(['/previous']); // Cambiar ruta según sea necesario
  }

  obtenerRoles() {
    this.http.get('https://siinad.mx/php/getRoles.php').subscribe(
      (response: any) => {
        this.rolesDisponibles = response;
      },
      (error) => {
        console.error('Error al obtener los roles:', error);
        this.mostrarToast('Error al obtener los roles', 'danger');
      }
    );
  }

  limpiarCampos() {
    this.usuario = {
      nombreUsuario: '',
      nombreCompleto: '',
      correo: '',
      numTelefonico: '',
      contrasena: '',
      confirmarContrasena: '',
      rfc: '',
      roleInCompany: '',
      nombreEmpresa: '',
      fechaInicio: '',
      fechaFin: '',
      empresaLigada: '',
    };
  }
}
