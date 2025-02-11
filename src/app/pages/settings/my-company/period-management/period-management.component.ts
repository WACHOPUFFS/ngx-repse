import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { CompanyService } from '../../../../services/company.service';
import { LocalDataSource } from 'ng2-smart-table';
import { LoadingController } from '@ionic/angular'; // Importar LoadingController

interface Period {
  period_number: number;
  start_date: string;
  end_date: string;
  payment_date: string;
  year: number;
  month: number;
  imss_bimonthly_start: boolean;
  imss_bimonthly_end: boolean;
  month_start: boolean;
  month_end: boolean;
  fiscal_year: string;
  fiscal_start: boolean;
  fiscal_end: boolean;
  payment_days: number;
}

@Component({
  selector: 'ngx-period-management',
  templateUrl: './period-management.component.html',
  styleUrls: ['./period-management.component.scss']
})
export class PeriodManagementComponent implements OnInit {

  periodTypes: any[] = [];
  selectedYearPeriods: Period[] = [];
  selectedYear: number | null = null;
  selectedPeriod: Period | null = null;
  source: LocalDataSource = new LocalDataSource();

  // Configuración de la tabla
  settings = {
    actions: false,
    columns: {
      period_number: {
        title: '# Semana',
        type: 'number',
        compareFunction: (direction: any, a: number, b: number) => {
          // Compara los números de forma ascendente o descendente
          if (a < b) {
            return direction === 'asc' ? -1 : 1;
          }
          if (a > b) {
            return direction === 'asc' ? 1 : -1;
          }
          return 0;
        },
      },
      start_date: {
        title: 'Fecha Inicio',
        type: 'string',
        valuePrepareFunction: (date) => {
          return new Date(date).toLocaleDateString('es-ES');
        },
      },
      end_date: {
        title: 'Fecha Fin',
        type: 'string',
        valuePrepareFunction: (date) => {
          return new Date(date).toLocaleDateString('es-ES');
        },
      },
      payment_date: {
        title: 'Días de Pago',
        type: 'string',
      },
    },
    hideSubHeader: true,
    noDataMessage: 'No hay periodos disponibles',
    attr: {
      class: 'table table-bordered',
    },
  };

  // Formulario
  form: any = {
    numeroPeriodo: '',
    fechaInicio: '',
    fechaFin: '',
    ejercicio: '',
    mes: '',
    diasPago: '',
    inicioMes: true,
    finMes: false,
    inicioBimestreIMSS: true,
    finBimestreIMSS: false,
    inicioEjercicio: true,
    finEjercicio: false
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private companyService: CompanyService,
    private loadingController: LoadingController // Inyectar LoadingController
  ) { }

  ngOnInit() {
    this.loadPeriodTypes();
  }

  // Método para mostrar el loading
  private async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent', // Puedes cambiar el tipo de spinner
      translucent: true,
    });
    await loading.present();
    return loading;
  }

  // Cargar tipos de periodos
  async loadPeriodTypes() {
    const loading = await this.showLoading('Cargando tipos de periodos...'); // Mostrar loading
    const companyId = this.companyService.selectedCompany.id;
    this.http.post('https://siinad.mx/php/get-period-types.php', { companyId })
      .subscribe(
        (response: any) => {
          this.periodTypes = response.periodTypes;
          loading.dismiss(); // Ocultar loading
        },
        error => {
          console.error('Error al cargar los tipos de periodos', error);
          loading.dismiss(); // Ocultar loading en caso de error
        }
      );
  }

  // Seleccionar tipo de periodo
  selectPeriodType(tipo: any) {
    if (tipo.years && tipo.years.length > 0) {
      this.selectedYear = tipo.years[0];
      this.selectedYearPeriods = tipo.periods.filter((period: Period) => period.year === this.selectedYear);
      this.source.load(this.selectedYearPeriods); // Cargar en la tabla
    }
  }

  // Seleccionar año
  selectYear(year: number) {
    this.selectedYear = year;
    this.selectedYearPeriods = this.periodTypes.find(tipo => tipo.years.includes(year))
      .periods.filter((period: Period) => period.year === year);
    this.source.load(this.selectedYearPeriods); // Cargar en la tabla
  }

  // Seleccionar periodo desde la tabla
  onRowSelect(event: any) {
    const period: Period = event.data;
    this.selectedPeriod = period;

    // Actualiza el formulario con los datos del periodo seleccionado
    this.form = {
      numeroPeriodo: period.period_number,
      fechaInicio: period.start_date,
      fechaFin: period.end_date,
      ejercicio: period.year,
      mes: period.month,
      diasPago: period.payment_days,
      inicioMes: period.month_start,
      finMes: period.month_end,
      inicioBimestreIMSS: period.imss_bimonthly_start,
      finBimestreIMSS: period.imss_bimonthly_end,
      inicioEjercicio: period.fiscal_start,
      finEjercicio: period.fiscal_end
    };
  }

  // Guardar los cambios en el periodo
  async guardarPeriodo() {
    const loading = await this.showLoading('Guardando periodo...'); // Mostrar loading
    const updatedPeriod: Period = {
      period_number: this.form.numeroPeriodo,
      start_date: this.form.fechaInicio,
      end_date: this.form.fechaFin,
      payment_date: this.form.diasPago,
      year: this.form.ejercicio,
      month: this.form.mes,
      imss_bimonthly_start: this.form.inicioBimestreIMSS,
      imss_bimonthly_end: this.form.finBimestreIMSS,
      month_start: this.form.inicioMes,
      month_end: this.form.finMes,
      fiscal_year: this.selectedPeriod?.fiscal_year || '',
      fiscal_start: this.form.inicioEjercicio,
      fiscal_end: this.form.finEjercicio,
      payment_days: this.form.diasPago
    };

    this.http.post('https://siinad.mx/php/update-period.php', updatedPeriod)
      .subscribe(
        response => {
          console.log('Periodo actualizado exitosamente', response);
          this.loadPeriodTypes(); // Actualiza los tipos de periodos
          loading.dismiss(); // Ocultar loading
        },
        error => {
          console.error('Error al actualizar el periodo', error);
          loading.dismiss(); // Ocultar loading en caso de error
        }
      );
  }

  // Guardar todos los cambios
  async guardarTodosLosPeriodos() {
    const loading = await this.showLoading('Guardando todos los periodos...'); // Mostrar loading
    this.http.post('https://siinad.mx/php/save-all-periods.php', this.selectedYearPeriods)
      .subscribe(
        response => {
          console.log('Todos los periodos actualizados exitosamente', response);
          this.loadPeriodTypes();
          loading.dismiss(); // Ocultar loading
        },
        error => {
          console.error('Error al guardar todos los periodos', error);
          loading.dismiss(); // Ocultar loading en caso de error
        }
      );
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.form = {
      numeroPeriodo: '',
      fechaInicio: '',
      fechaFin: '',
      ejercicio: '',
      mes: '',
      diasPago: '',
      inicioMes: true,
      finMes: false,
      inicioBimestreIMSS: true,
      finBimestreIMSS: false,
      inicioEjercicio: true,
      finEjercicio: false
    };
    this.selectedPeriod = null;
  }
}