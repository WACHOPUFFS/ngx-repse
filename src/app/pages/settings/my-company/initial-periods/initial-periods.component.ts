import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { CompanyService } from '../../../../services/company.service';
import { NbToastrService } from '@nebular/theme';
import { NbComponentStatus } from '@nebular/theme';
import { LoadingController } from '@ionic/angular'; // Importar LoadingController
import { SelectCompanyPeriodDialogComponent } from '../../../../select-company-period-dialog/select-company-period-dialog.component';
import { NbDialogService } from '@nebular/theme';
import { Router } from '@angular/router';
@Component({
  selector: 'ngx-initial-periods',
  templateUrl: './initial-periods.component.html',
  styleUrls: ['./initial-periods.component.scss']
})
export class InitialPeriodsComponent {
  periodoSemanal: boolean = false;
  periodoQuincenal: boolean = false;
  periodoMensual: boolean = false;
  fechaSemanal: string;
  fechaQuincenal: string;
  fechaMensual: string;
  ejercicioSemanal: number;
  ejercicioQuincenal: number;
  ejercicioMensual: number;
  minDate: string;
  maxDate: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private companyService: CompanyService,
    private toastrService: NbToastrService,
    private loadingController: LoadingController, // Inyectar LoadingController
    private dialogService: NbDialogService,
    private router: Router
  ) {}


  onDateChange(event: any, tipo: string) {
    console.log('Fecha seleccionada:', event); // Verifica el valor del evento
    const fecha = new Date(event);
    console.log('Fecha convertida:', fecha); // Verifica que la fecha sea válida
  
    if (isNaN(fecha.getTime())) {
      console.error('Fecha inválida');
      return;
    }
  
    const añoFiscal = fecha.getFullYear();
    console.log('Año fiscal calculado:', añoFiscal); // Verifica el año fiscal
  
    switch (tipo) {
      case 'semanal':
        this.ejercicioSemanal = añoFiscal;
        break;
      case 'quincenal':
        this.ejercicioQuincenal = añoFiscal;
        break;
      case 'mensual':
        this.ejercicioMensual = añoFiscal;
        break;
      default:
        console.error('Tipo de período no válido');
        break;
    }
  
    console.log('Valores actualizados:', {
      semanal: this.ejercicioSemanal,
      quincenal: this.ejercicioQuincenal,
      mensual: this.ejercicioMensual
    });
  }

  private getFirstSunday(startDate: Date): number {
    // Clonar la fecha para no modificar la original
    const date = new Date(startDate);
  
    // Encontrar el primer domingo
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }
  
    // Devolver el día del mes del primer domingo
    return date.getDate();
  }
  
  private showToast(message: string, status: NbComponentStatus) {
    this.toastrService.show(
      message,
      'Información',
      {
        status: status,
        duration: 3000,
      }
    );
  }

  async guardarConfiguracion() {
    // Validar que se haya seleccionado al menos un período
    if (!this.periodoSemanal && !this.periodoQuincenal && !this.periodoMensual) {
      this.showToast("Debes seleccionar al menos un período", 'danger');
      return;
    }

    // Validar que se haya seleccionado una fecha para el período habilitado
    if (
      (this.periodoSemanal && !this.fechaSemanal) ||
      (this.periodoQuincenal && !this.fechaQuincenal) ||
      (this.periodoMensual && !this.fechaMensual)
    ) {
      this.showToast("Debes seleccionar una fecha para el período habilitado", 'danger');
      return;
    }

    // Mostrar el indicador de carga
    const loading = await this.loadingController.create({
      message: 'Guardando configuración...',
    });
    await loading.present();

    const companyId = this.companyService.selectedCompany.id;
    const periodos: Periodo[] = [];

    if (this.periodoSemanal) {
      const firstSunday = this.getFirstSunday(new Date(this.fechaSemanal));
      periodos.push({
        nombretipoperiodo: 'Semanal',
        diasdelperiodo: 7,
        diasdepago: 6,
        periodotrabajo: 1,
        modificarhistoria: 1,
        ajustarperiodoscalendario: 0,
        numeroseptimos: 1,
        posicionseptimos:  JSON.stringify([firstSunday.toString()]), // Añadir el primer domingo,
        posicionpagonomina: 6,
        fechainicioejercicio: this.fechaSemanal,
        ejercicio: this.ejercicioSemanal,
        ccalculomescalendario: 0,
        PeriodicidadPago: '02',
        
      });
      this.showToast("Periodo semanal guardado correctamente", 'success');
    }

    if (this.periodoQuincenal) {
      const firstSunday = this.getFirstSunday(new Date(this.fechaQuincenal));
      periodos.push({
        nombretipoperiodo: 'Quincenal',
        diasdelperiodo: 15,
        diasdepago: 15,
        periodotrabajo: 1,
        modificarhistoria: 0,
        ajustarperiodoscalendario: 1,
        numeroseptimos: 0,
        posicionseptimos:  JSON.stringify([firstSunday.toString()]), // Añadir el primer domingo,
        posicionpagonomina: 15,
        fechainicioejercicio: this.fechaQuincenal,
        ejercicio: this.ejercicioQuincenal,
        ccalculomescalendario: 0,
        PeriodicidadPago: '04'
      });
      this.showToast("Periodo quincenal guardado correctamente", 'success');
    }

    if (this.periodoMensual) {
      const firstSunday = this.getFirstSunday(new Date(this.fechaMensual));
      periodos.push({
        nombretipoperiodo: 'Mensual',
        diasdelperiodo: 30,
        diasdepago: 30,
        periodotrabajo: 1,
        modificarhistoria: 0,
        ajustarperiodoscalendario: 1,
        numeroseptimos: 0,
        posicionseptimos:  JSON.stringify([firstSunday.toString()]), // Añadir el primer domingo,
        posicionpagonomina: 30,
        fechainicioejercicio: this.fechaMensual,
        ejercicio: this.ejercicioMensual,
        ccalculomescalendario: 0,
        PeriodicidadPago: '05'
      });
      this.showToast("Periodo mensual guardado correctamente", 'success');
    }

    const configuracion = {
      companyId: companyId,
      periodos: periodos
    };

    this.http.post('https://siinad.mx/php/save-periods.php', configuracion)
      .subscribe(async (response: any) => {
        console.log('Configuración guardada correctamente', response);

        const periodTypesData = response.periods;
        const periodTypes = periodTypesData.map((p: any) => ({
          period_type_name: p.period_type_name,
          period_type_id: p.period_type_id
        }));

        await this.createPayrollPeriods(periodTypes, periodos[0]);

        localStorage.setItem('isFirstTime', 'false');
        this.resetForm(); // Limpiar el formulario después de guardar
        loading.dismiss(); // Ocultar el indicador de carga

        this.router.navigate(['/dashboard']);

        this.dialogService.open(SelectCompanyPeriodDialogComponent, {});
      }, error => {
        console.error('Error al guardar la configuración', error);
        loading.dismiss(); // Ocultar el indicador de carga en caso de error
      });
  }

  async createPayrollPeriods(periodTypes: { period_type_name: string, period_type_id: number }[], periodo: Periodo) {
    if (!Array.isArray(periodTypes)) {
      console.error('periodTypes debe ser un array');
      return;
    }
  
    if (periodTypes.length === 0) {
      console.warn('No se seleccionaron tipos de periodos');
      return;
    }
  
    const companyId = this.companyService.selectedCompany.id;
    const startDate = new Date(periodo.fechainicioejercicio);
    const allPeriods = [];
  
    for (const periodTypeData of periodTypes) {
      const periodType = periodTypeData.period_type_name;
      const periodTypeId = periodTypeData.period_type_id;
  
      if (!['Semanal', 'Quincenal', 'Mensual'].includes(periodType)) {
        console.error(`Tipo de período no válido: ${periodType}`);
        continue;
      }
  
      const totalPeriods = periodType === 'Semanal' ? 52 :
        periodType === 'Quincenal' ? 24 : 12;
  
      const fiscalYear = periodType === 'Semanal' ? this.ejercicioSemanal :
        periodType === 'Quincenal' ? this.ejercicioQuincenal :
        this.ejercicioMensual;
  
      let currentStartDate = startDate;
  
      for (let i = 0; i < totalPeriods; i++) {
        let periodEndDate = new Date(currentStartDate);
        let paymentDate: Date | null = null;
  
        // Calcular fecha de fin de período
        if (periodType === 'Semanal' || periodType === 'Quincenal') {
          periodEndDate.setDate(currentStartDate.getDate() + periodo.diasdelperiodo - 1);
        } else if (periodType === 'Mensual') {
          periodEndDate.setMonth(currentStartDate.getMonth() + 1);
          periodEndDate.setDate(0);
        }
  
        // Calcular payment_date según el tipo
        if (periodType === 'Semanal') {
          paymentDate = new Date(periodEndDate);
          paymentDate.setDate(paymentDate.getDate() + 3);
          paymentDate = this.adjustPaymentDate(paymentDate);
        } else if (periodType === 'Quincenal') {
          paymentDate = new Date(periodEndDate);
          paymentDate = this.adjustPaymentDateQuincenal(paymentDate);
        } else if (periodType === 'Mensual') {
          paymentDate = new Date(currentStartDate);
          paymentDate.setDate(15);
          paymentDate = this.adjustPaymentDateQuincenal(paymentDate);
        }
  
        // Validar fecha de pago
        if (!paymentDate || isNaN(paymentDate.getTime())) {
          console.error('Fecha de pago inválida para el período:', periodType);
          continue;
        }
  
        const payrollPeriod = {
          company_id: companyId,
          period_type_id: periodTypeId,
          period_number: i + 1,
          fiscal_year: fiscalYear,
          month: currentStartDate.getMonth() + 1,
          payment_days: periodType === 'Mensual' ? periodEndDate.getDate() : periodo.diasdelperiodo,
          rest_days: periodo.numeroseptimos,
          interface_check: 0,
          net_modification: 0,
          calculated: 0,
          affected: 0,
          start_date: currentStartDate.toISOString().split('T')[0],
          end_date: periodEndDate.toISOString().split('T')[0],
          fiscal_start: i === 0 ? 1 : 0,
          month_start: currentStartDate.getDate() === 1 ? 1 : 0,
          month_end: periodEndDate.getDate() === new Date(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 0).getDate() ? 1 : 0,
          fiscal_end: i === totalPeriods - 1 ? 1 : 0,
          timestamp: new Date().toISOString().split('T')[0],
          imss_bimonthly_start: 0,
          imss_bimonthly_end: 0,
          payment_date: paymentDate.toISOString().split('T')[0]
        };
  
        allPeriods.push(payrollPeriod);
  
        // Preparar siguiente período
        currentStartDate = new Date(periodEndDate);
        currentStartDate.setDate(currentStartDate.getDate() + 1);
      }
    }
  
    try {
      await this.http.post('https://siinad.mx/php/create-payroll-period.php', { periods: allPeriods }).toPromise();
      console.log('Periodos creados correctamente');
    } catch (error) {
      console.error('Error al crear periodos:', error);
    }
  }

  private adjustPaymentDate(date: Date): Date {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Domingo → Lunes
      date.setDate(date.getDate() + 1);
    } else if (dayOfWeek === 6) { // Sábado → Lunes
      date.setDate(date.getDate() + 2);
    }
    return date;
  }

  private adjustPaymentDateQuincenal(date: Date): Date {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Domingo → Viernes
      date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Sábado → Viernes
      date.setDate(date.getDate() - 1);
    }
    return date;
  }

  resetForm() {
    this.periodoSemanal = false;
    this.periodoQuincenal = false;
    this.periodoMensual = false;
    this.fechaSemanal = null;
    this.fechaQuincenal = null;
    this.fechaMensual = null;
  }

}

interface Periodo {
  nombretipoperiodo: string;
  diasdelperiodo: number;
  diasdepago: number;
  periodotrabajo: number;
  modificarhistoria: number;
  ajustarperiodoscalendario: number;
  numeroseptimos: number | null;
  posicionseptimos: string;
  posicionpagonomina: number;
  fechainicioejercicio: string;
  ejercicio: number;
  ccalculomescalendario: number;
  PeriodicidadPago: string;
}