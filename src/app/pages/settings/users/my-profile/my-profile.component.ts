import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbToastrService } from '@nebular/theme';
import { CompanyService } from '../../../../services/company.service';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular'; // Importar LoadingController
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'ngx-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit, OnDestroy {
  idUser: string;
  fullName: string;
  userName: string;
  userEmail: string;
  userPassword: string;
  confirmPassword: string;
  avatar: string;
  editMode: string = 'edit'; // Inicializa el modo de edición a 'edit'
  generatedCode: string = ''; // Inicializa el código generado
  employeeName: string;
  employeeId: string;
  

  constructor(
    private http: HttpClient,
    private toastrService: NbToastrService,
    private companyService: CompanyService,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController, // Inyectar LoadingController
    private cdr: ChangeDetectorRef,
  ) {
    // Inicialización
    this.idUser = this.authService.userId; // Si tienes un servicio para obtener el userId
    this.employeeName = this.authService.username;
    this.employeeId = this.authService.userId;
  }

  async ngOnInit() {
    await this.getUserData();
    await this.getUserAvatar();
    this.generatedCode = this.createUniqueCode(); // Genera el código único al iniciar
    await this.saveGeneratedCode(); // Guarda el código generado en la tabla `user_codes`
  }

  async getUserData() {
    const loading = await this.showLoading('Cargando datos del usuario...'); // Mostrar loading
    const url = `https://www.siinad.mx/php/get_user.php?idUser=${this.idUser}`;
    this.http.get(url).subscribe(
      (response: any) => {
        if (response.success) {
          this.fullName = response.data.name;
          this.userName = response.data.username;
          this.userEmail = response.data.email;
        } else {
          this.showAlert('Error', response.message);
        }
        loading.dismiss(); // Ocultar loading
      },
      (error) => {
        this.showAlert('Error', 'Error al cargar los datos del usuario.');
        loading.dismiss(); // Ocultar loading
      }
    );
  }

  validarCorreo(correo: string): boolean {
    // Expresión regular mejorada para validar correos
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
  }
  
  async getUserAvatar() {
    const loading = await this.showLoading('Cargando avatar...'); // Mostrar loading
    const url = `https://www.siinad.mx/php/getUserAvatar.php?userId=${this.idUser}`;
    this.http.get(url).subscribe(
      (response: any) => {
        if (response.avatarUrl) {
          this.avatar = response.avatarUrl;
          this.cdr.detectChanges();
        } else {
          this.showAlert('Error', response.error);
        }
        loading.dismiss(); // Ocultar loading
      },
      (error) => {
        this.showAlert('Error', 'Error al cargar el avatar.');
        loading.dismiss(); // Ocultar loading
      }
    );
  }

  // Simular clic en un input de archivo oculto
  triggerFileInput(inputId: string) {
    const fileInput = document.getElementById(inputId) as HTMLElement;
    if (fileInput) {
      fileInput.click();
    } else {
      console.error('No se pudo encontrar el input de archivo con ID:', inputId);
    }
  }

  
  async changeProfilePicture(event: Event) {
    const loading = await this.showLoading('Actualizando avatar...');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
  
    if (!file) {
      loading.dismiss();
      return;
    }
  
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/tiff', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      this.showAlert('Error', 'Solo se permiten archivos de imagen.');
      loading.dismiss();
      return;
    }
  
    // Redimensionar y convertir a WebP
    this.resizeAndConvertToWebP(file, 300)
      .then((webpFile) => {
        const formData = new FormData();
        formData.append('avatar', webpFile);
        formData.append('userId', this.idUser);
  
        const url = `https://www.siinad.mx/php/upload_avatar.php`;
        this.http.post(url, formData).subscribe(
          (response: any) => {
            if (response.success) {
              this.authService.updateAvatar(response.avatarUrl);
              this.avatar = response.avatarUrl; // Actualizar la variable local
              this.cdr.detectChanges();  // Forzar actualización en la UI
              this.showAlert('Éxito', 'Avatar actualizado exitosamente.');
            } else {
              this.showAlert('Error', response.error);
            }
            loading.dismiss();
          },
          (error) => {
            this.showAlert('Error', 'Error al actualizar el avatar.');
            loading.dismiss();
          }
        );
      })
      .catch(() => {
        this.showAlert('Error', 'No se pudo procesar la imagen.');
        loading.dismiss();
      });
  }
  
  

  /**
   * Redimensiona una imagen y la convierte a WebP
   */
  resizeAndConvertToWebP(file: File, maxWidth: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calcular la nueva altura manteniendo la proporción
          const scaleFactor = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleFactor;

          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convertir a WebP con calidad 80%
          canvas.toBlob((blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
              resolve(webpFile);
            } else {
              reject(new Error('No se pudo convertir la imagen a WebP.'));
            }
          }, 'image/webp', 0.8);
        };
      };

      reader.onerror = (error) => reject(error);
    });
  }
  
  
  

  createUniqueCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  async generateAndShareCode() {
    this.generatedCode = this.createUniqueCode(); // Genera un nuevo código
    await this.saveGeneratedCode(); // Guarda el nuevo código generado en la tabla `user_codes`
  }

  async saveGeneratedCode() {
    const loading = await this.showLoading('Guardando código...'); // Mostrar loading
    const data = {
      user_id: this.idUser,
      code: this.generatedCode
    };

    const url = `https://www.siinad.mx/php/save_user_code.php`;
    this.http.post(url, data).subscribe(
      (response: any) => {
        if (response.success) {
          console.log('Código guardado exitosamente en la tabla user_codes.');
        } else {
          console.error('Error al guardar el código:', response.error);
        }
        loading.dismiss(); // Ocultar loading
      },
      (error) => {
        console.error('Error en la solicitud POST:', error);
        loading.dismiss(); // Ocultar loading
      }
    );
  }

  async saveSettings() {
    if (this.userPassword !== this.confirmPassword) {
      this.showAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (this.userPassword == null || this.confirmPassword == null) {
      this.showAlert('Error', 'Debes colocar la contraseña');
      return;
    }
  
    // Validar correo electrónico
    if (!this.validarCorreo(this.userEmail)) {
      this.showAlert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }
  
    const loading = await this.showLoading('Guardando configuración...');
    const data = {
      idUser: this.idUser,
      fullName: this.fullName,
      userName: this.userName,
      userEmail: this.userEmail,
      userPassword: this.userPassword // Solo si la contraseña ha sido cambiada
    };
  
    const url = `https://www.siinad.mx/php/update_user.php`;
    this.http.post(url, data).subscribe(
      (response: any) => {
        this.showAlert(response.success ? 'Éxito' : 'Error', response.message);
        loading.dismiss();
      },
      (error) => {
        this.showAlert('Error', 'Error al guardar la configuración.');
        loading.dismiss();
      }
    );
  }
  async shareCode() {
    if (this.generatedCode) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.generatedCode).then(() => {
          this.showAlert('Éxito', 'Código copiado al portapapeles.');
        }).catch((err) => {
          console.error('Error al copiar el código: ', err);
          this.showAlert('Error', 'No se pudo copiar el código.');
        });
      } else {
        // Fallback para navegadores que no soportan navigator.clipboard
        this.fallbackCopyTextToClipboard(this.generatedCode);
      }
    } else {
      this.showAlert('Advertencia', 'No hay código para copiar.');
    }
  }

  // Método de fallback usando un textarea temporal
  fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Evitar que el textarea sea visible
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showAlert('Éxito', 'Código copiado al portapapeles.');
      } else {
        this.showAlert('Error', 'No se pudo copiar el código.');
      }
    } catch (err) {
      console.error('Error al copiar el código: ', err);
      this.showAlert('Error', 'No se pudo copiar el código.');
    }

    document.body.removeChild(textArea);
  }

  showAlert(header: string, message: string) {
    let status: 'success' | 'danger' | 'warning' = 'success';

    if (header === 'Error') {
      status = 'danger';
    } else if (header === 'Advertencia') {
      status = 'warning';
    }

    this.toastrService.show(message, header, {
      status: status,
      destroyByClick: true,
      duration: 5000
    });
  }

  async deleteEmployeeCode() {
    const loading = await this.showLoading('Eliminando código...'); // Mostrar loading
    const data = { employeeId: this.employeeId };

    this.http.post('https://siinad.mx/php/delete-employee-code.php', data).subscribe(
      (response: any) => {
        if (response.success) {
          console.log('Código eliminado con éxito.');
        } else {
          console.error(response.error);
          this.showAlert('Error', 'Error al eliminar el código.');
        }
        loading.dismiss(); // Ocultar loading
      },
      (error) => {
        console.error('Error en la solicitud POST:', error);
        this.showAlert('Error', 'Error al eliminar el código.');
        loading.dismiss(); // Ocultar loading
      }
    );
  }

  ionViewWillLeave() {
    this.deleteEmployeeCode();
  }

  ngOnDestroy() {
    this.deleteEmployeeCode();
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
}