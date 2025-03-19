import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { NbDialogService } from '@nebular/theme'; // Importa el servicio de diálogo de Nebular
import { CompanyService } from '../../../../services/company.service';
import { ChangeDetectorRef } from '@angular/core';
import { finalize } from 'rxjs/operators';



interface Tarea {
  id: number;
  nombre: string;
  enero: boolean;
  febrero: boolean;
  marzo: boolean;
  abril: boolean;
  mayo: boolean;
  junio: boolean;
  julio: boolean;
  agosto: boolean;
  septiembre: boolean;
  octubre: boolean;
  noviembre: boolean;
  diciembre: boolean;
  estado: string;
  file_path?: string;  // propiedad legacy, se usará "documents" para múltiples registros
  documents?: Array<{ file_path: string; month: string; year: number; estado: string }>;
  [key: string]: any;  // Permite el acceso dinámico a las propiedades
}




@Component({
  selector: 'app-mensual-upload',
  templateUrl: './mensual-upload.component.html',
  styleUrls: ['./mensual-upload.component.scss'],
})
export class MensualUploadComponent implements OnInit {
  meses: string[] = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

 years: number[] = [2023, 2024, 2025, 2026, 2027]; 

 selectedMonth: string = this.meses[new Date().getMonth()];
 selectedYear: number = new Date().getFullYear();

  tareas: Tarea[] = [
    { id: 1, nombre: 'Ause ISCOE', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 2, nombre: 'Ause SISUB', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 3, nombre: 'Archivo SUA', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 4, nombre: 'CFDI nómina (xml y PDF)', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 5, nombre: 'Declaración y Acuse De ISR', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 6, nombre: 'Declaración y Acuse De IVA', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 7, nombre: 'Lista Del Personal', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 8, nombre: 'Opinión Cumplimiento SAT', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 9, nombre: 'Opinión cumplimiento IMSS', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 10, nombre: 'Opinión de cumplimiento INFONAVIT', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 11, nombre: 'Pago Bancario De ISR', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 12, nombre: 'Pago Bancario De IVA', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 13, nombre: 'Pago Bancario IMSS', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 14, nombre: 'Reporte ISCOE', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
    { id: 15, nombre: 'Reporte SISUB', enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false, estado: 'No cargado' },
  ];

  cargados: number = 0;
  completos: number = 0;
  incompletos: number = 0;
  noCargados: number = this.tareas.length;
  cargando: boolean = false;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private dialogService: NbDialogService,
    public companyservice: CompanyService,
    private cdRef: ChangeDetectorRef // 👈 Agregado
  ) {}
  

  ngOnInit() {
    this.obtenerEstadoArchivos();
  }

  getStatus(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'aceptado': return 'success';
      case 'rechazado': return 'danger';
      case 'cargado': return 'info';
      default: return 'basic';
    }
  }

  async openModal(tarea: Tarea) {
    // Aquí puedes implementar la lógica para abrir un modal usando NbDialogService.
    // Por ejemplo, si tienes un componente para el diálogo:
    // this.dialogService.open(TuComponenteModal, { context: { tarea } });
  }

  triggerFileInput(id: number) {
    const fileInput = document.getElementById(`fileInput${id}`) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.click();
    } else {
      console.error(`Element with id fileInput${id} not found`);
    }
  }

  onFileSelected(event: Event, tarea: Tarea) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file: File = input.files[0];
      console.log(`Archivo seleccionado para ${tarea.nombre}:`, file.name);
      this.uploadFile(tarea, file);
    }
  }

  getIconForDocument(tarea: Tarea, month: string, year: number): string {
    const doc = tarea.documents?.find(d => d.month === month && d.year === year);
    if (!doc) return '';
    const estado = doc.estado.toLowerCase();
    if (estado === 'aceptado') return 'checkmark-outline';
    if (estado === 'rechazado') return 'close-outline';
    if (estado === 'cargado') return 'clock-outline';
    return 'clock-outline';
  }
  
  
  uploadFile(tarea: Tarea, file: File) {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('userId', this.authService.userId);
    formData.append('companyId', this.companyservice.selectedCompany.id);
    formData.append('tareaId', tarea.id.toString());
    formData.append('month', this.selectedMonth);
    formData.append('year', this.selectedYear.toString());
  
    this.cargando = true;
    this.http.post('https://siinad.mx/php/documentUpload.php', formData)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe(response => {
        console.log('Respuesta del servidor:', response);
        tarea.estado = 'cargado';
        this.updateCounters();
        this.obtenerEstadoArchivos();
      }, error => {
        console.error('Error al subir el archivo:', error);
      });
  }
  

  updateCounters() {
    this.cargados = this.tareas.filter(t => t.estado === 'cargado').length;
    this.completos = this.tareas.filter(t => t.estado === 'aceptado').length;
    this.incompletos = this.tareas.filter(t => t.estado === 'rechazado').length;
    this.noCargados = this.tareas.length - this.cargados - this.completos - this.incompletos;
  
    this.cdRef.detectChanges(); // 👈 Forzamos la actualización
  }
  

  descargarArchivo(tarea: Tarea, month: string, year: number) {
    const doc = tarea.documents?.find(d => d.month === month && d.year === year);
    if (doc && doc.file_path) {
      window.open(`https://siinad.mx/php/${doc.file_path}`, '_blank');
    } else {
      console.error('No se encontró un archivo para descargar en el mes y año seleccionados.');
    }
  }
  

  hasDocumentForYear(tarea: Tarea, month: string, year: number): boolean {
    return tarea.documents?.some(d => d.month === month && d.year === year) ?? false;
  }
  
  

  obtenerEstadoArchivos() {
    const companyId = this.companyservice.selectedCompany.id;
    if (!companyId) {
      console.error('Company ID is missing.');
      return;
    }
    console.log('Obteniendo estado de archivos para companyId:', companyId);
    this.cargando = true;
    this.http.get<any[]>(`https://siinad.mx/php/getDocumentStatus.php?companyId=${companyId}`)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Respuesta de la API:', response);
          if (Array.isArray(response)) {
            this.tareas.forEach(t => t.documents = []);
            response.forEach((doc) => {
              const tarea = this.tareas.find(t => t.id === parseInt(doc.tarea_id, 10));
              if (tarea) {
                tarea.documents.push({
                  file_path: doc.file_path,
                  month: doc.month ?? '',
                  estado: doc.estado ?? 'No cargado',
                  year: doc.year ?? 0,
                });
                this.meses.forEach(mes => {
                  if (doc[mes] !== undefined) {
                    tarea[mes] = doc[mes];
                  }
                });
              }
            });
            this.updateCounters();
          } else {
            console.error('Formato de respuesta inesperado:', response);
          }
        },
        error: (error) => {
          console.error('Error al obtener el estado de los archivos:', error);
        },
        complete: () => {
          console.log('Llamada a la API completada');
        }
      });
  }
  
  
  
}
