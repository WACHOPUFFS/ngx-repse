import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import * as moment from 'moment';
import { AssignmentSummaryComponent } from '../assignment-summary/assignment-summary.component';
import { NbDialogService } from '@nebular/theme';
import { Router } from '@angular/router';
import { CompanyService } from '../../../services/company.service';
import { PeriodService } from '../../../services/period.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'ngx-assign-projects',
  templateUrl: './assign-projects.component.html',
  styleUrls: ['./assign-projects.component.scss'],
})
export class AssignProjectsComponent implements OnInit {
  semanas: any[] = [];
  selectedSemana: any;
  selectedDia: string = '';
  obras: any[] = [];
  filteredObras: any[] = [];
  selectedObra: any;
  empleados: any[] = [];
  selectedEmpleados: any[] = [];
  searchEmployee: string = '';
  filteredEmpleados: any[] = [];
  diasSemana: any[] = [];
  searchObra: string = '';

  constructor(
    private dialogService: NbDialogService,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService,
    private periodService: PeriodService,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    moment.locale('es');
    this.loadWeeks();
  }

  formatDate(date: string): string {
    return moment(date).format('DD MMM YYYY');
  }

  async loadWeeks() {
    const companyId = this.companyService.selectedCompany.id;
    const selectedPeriod = this.periodService.selectedPeriod.id;
  
    if (!selectedPeriod) {
      console.error('No se ha seleccionado un tipo de periodo');
      return;
    }
  
    let loading = await this.loadingController.create({
      message: 'Cargando semanas...',
      spinner: 'circles',
    });
  
    try {
      await loading.present();
  
      this.http.get(`https://siinad.mx/php/get_weekly_periods.php?company_id=${companyId}&period_type_id=${selectedPeriod}`)
        .subscribe((data: any) => {
          this.semanas = data;
          
          // Encontrar la semana actual
          const today = moment();
          const currentWeek = this.semanas.find(semana => {
            const start = moment(semana.start_date);
            const end = moment(semana.end_date);
            return today.isBetween(start, end, null, '[]'); // [] incluye los extremos
          });
  
          // Establecer la semana seleccionada
          this.selectedSemana = currentWeek || this.semanas[0];
          
          this.onSemanaChange(this.selectedSemana);
        }, error => {
          console.error('Error al cargar las semanas', error);
        }, () => {
          loading.dismiss();
        });
    } catch (e) {
      console.error('Error al presentar el loading', e);
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  isCurrentWeek(semana: any): boolean {
    const today = moment();
    const start = moment(semana.start_date);
    const end = moment(semana.end_date);
    return today.isBetween(start, end, null, '[]');
  }

  resetFields(): void {
    this.selectedSemana = null;
    this.selectedDia = '';
    this.selectedObra = null;
    this.selectedEmpleados = [];
    this.searchEmployee = '';
    this.filteredEmpleados = [];
    this.diasSemana = [];
    this.searchObra = '';
    this.filteredObras = [];
  }

  onSemanaChange(semana: any): void {
    this.resetFields();
    this.selectedSemana = semana;
    this.generateDiasSemana(semana.start_date, semana.end_date);
    this.loadObras(semana.start_date, semana.end_date);
  }

  generateDiasSemana(startDate: string, endDate: string) {
    const start = moment(startDate);
    const end = moment(endDate);
    this.diasSemana = [];

    let day = start;
    while (day <= end) {
      this.diasSemana.push({
        date: day.format('YYYY-MM-DD'),
        display: day.format('dddd'),
      });
      day = day.add(1, 'day');
    }
  }

  onDiaChange(dia: string): void {
    this.selectedDia = dia;
    this.loadEmpleados(this.selectedSemana, dia, this.selectedObra);
  }

  async loadObras(startDate: string, endDate: string) {
    let loading = await this.loadingController.create({
      message: 'Cargando obras...',
      spinner: 'circles',
    });

    try {
      await loading.present();

      const companyId = this.companyService.selectedCompany.id; // Obtener el companyId desde AuthService

      this.http.get(`https://siinad.mx/php/get_projects_by_date.php?start_date=${startDate}&end_date=${endDate}&company_id=${companyId}`)
        .subscribe((data: any) => {
          this.obras = data.sort((a, b) => a.project_name.localeCompare(b.project_name, 'es'));
          this.filterObrasByDate(startDate, endDate);
          this.filterObras(); // Inicializar la lista filtrada
        }, error => {
          console.error('Error al cargar las obras', error);
        }, () => {
          loading.dismiss();
        });
    } catch (e) {
      console.error('Error al presentar el loading', e);
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  filterObrasByDate(startDate: string, endDate: string) {
    const start = moment(startDate);
    const end = moment(endDate);

    this.filteredObras = this.obras.filter((obra) => {
      const obraStartDate = moment(obra.start_date);
      const obraEndDate = moment(obra.end_date);
      return obraStartDate.isBetween(start, end, 'day', '[]') || obraEndDate.isBetween(start, end, 'day', '[]');
    });


  }

  async loadEmpleados(semana: any, dia: string, obra: any) {
    let loading = await this.loadingController.create({
      message: 'Cargando empleados...',
      spinner: 'circles',
    });
  
    try {
      await loading.present();
  
      if (semana && dia && obra) {
        const companyId = this.companyService.selectedCompany.id;
        const userId = this.authService.userId; // Agregado: Obtener el user_id del usuario autenticado
        const startDate = this.selectedSemana?.start_date;
        const endDate = this.selectedSemana?.end_date;
        const weekNumber = this.selectedSemana?.week_number;
        const dayOfWeek = this.selectedDia;
  
        // Obtener empleados activos con filtro de department_range
        this.http.get(`https://siinad.mx/php/get_active_employees_by_date.php?start_date=${startDate}&end_date=${endDate}&company_id=${companyId}&user_id=${userId}`)
          .subscribe((data: any) => {
            this.empleados = Array.isArray(data) ? data : [];
            this.filterEmpleados();
  
            // Obtener empleados ya asignados con el filtro de department_range
            this.http.get(`https://siinad.mx/php/get_assigned_employees.php?start_date=${startDate}&end_date=${endDate}&company_id=${companyId}&week_number=${weekNumber}&day_of_week=${dayOfWeek}&user_id=${userId}`)
              .subscribe((assignedData: any) => {
                this.markAssignedEmployees(assignedData);
              }, error => {
                console.error('Error al cargar empleados asignados', error);
              }, () => {
                loading.dismiss();
              });
          }, error => {
            console.error('Error al cargar los empleados', error);
          }, () => {
            loading.dismiss();
          });
      } else {
        loading.dismiss();
      }
    } catch (e) {
      console.error('Error al presentar el loading', e);
      if (loading) {
        await loading.dismiss();
      }
    }
  }
  
  markAssignedEmployees(assignedEmployees: any) {

    const assignedIds = assignedEmployees.map(id => Number(id));

    this.empleados.forEach(empleado => {
    
      // Verificar si el ID existe en la lista de asignados
      empleado.isAssigned = assignedIds.includes(empleado.employee_id);
      
      // Si está asignado, quitar selección si existe
      if (empleado.isAssigned && empleado.selected) {
        empleado.selected = false;
        const index = this.selectedEmpleados.indexOf(empleado);
        if (index > -1) {
          this.selectedEmpleados.splice(index, 1);
        }
      }
    });
    
    this.filterEmpleados();
  }

  filterObras() {
    const searchTerm = this.searchObra.toLowerCase();
    this.filteredObras = this.obras
      .filter(obra => obra.project_name.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.project_name.localeCompare(b.project_name, 'es')); // Orden adicional
  }

  filterEmpleados() {
    const searchTerm = this.searchEmployee.toLowerCase();
    this.filteredEmpleados = this.empleados.filter(empleado => {
      const fullName = `${empleado.last_name} ${empleado.middle_name} ${empleado.first_name}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
  }


  toggleEmpleadoSelection(empleado: any): void {
    if (empleado.isAssigned) return; // No hacer nada si está asignado
  
    empleado.selected = !empleado.selected;
  
    const index = this.selectedEmpleados.indexOf(empleado);
    if (empleado.selected && index === -1) {
      // Agregar empleado a la lista seleccionada
      this.selectedEmpleados.push(empleado);
    } else if (!empleado.selected && index > -1) {
      // Remover empleado de la lista seleccionada
      this.selectedEmpleados.splice(index, 1);
    }
  }
  
  
  

  async assignEmployees() {
    const dialogRef = this.dialogService.open(AssignmentSummaryComponent, {
      context: {
        selectedSemana: this.selectedSemana,
        selectedDia: this.selectedDia,
        selectedObra: this.selectedObra,
        selectedEmpleados: this.selectedEmpleados,
        authService: this.authService,
      },
      closeOnBackdropClick: false,
    });

    dialogRef.onClose.subscribe((data) => {
      if (data?.confirmed) {
        this.sendAssignment();
      }
    });
  }

  async sendAssignment() {
    // Crear el spinner de carga
    const loading = await this.loadingController.create({
      message: 'Asignando empleados...',
      spinner: 'circles',
    });
  
    // Mostrar el spinner de carga
    await loading.present();
  
    try {
      const data = {
        weekNumber: this.selectedSemana?.week_number,
        startDate: this.selectedSemana?.start_date,
        endDate: this.selectedSemana?.end_date,
        dayOfWeek: this.selectedDia,
        dayText: moment(this.selectedDia).format('dddd'),
        obraId: this.selectedObra?.project_id,
        employeeIds: this.selectedEmpleados.map((e) => Number(e.employee_id)),
        companyId: this.companyService.selectedCompany.id,
        fiscalYear: this.periodService.selectedPeriod.year,
        periodTypeId: this.periodService.selectedPeriod.id,
        periodNumber: this.selectedSemana?.period_number,
        periodId: this.selectedSemana?.period_id,
      };
  
      // Realizar la solicitud HTTP
      await this.http.post('https://siinad.mx/php/assign-employees.php', data).toPromise();
      console.log('Empleados asignados correctamente');
  
      // Marcar empleados como asignados
      this.selectedEmpleados.forEach((empleado) => {
        empleado.isAssigned = true;
      });
  
      // Limpiar la lista de empleados seleccionados
      this.selectedEmpleados = [];
    } catch (error) {
      console.error('Error al asignar empleados', error);
    } finally {
      // Cerrar el spinner de carga
      loading.dismiss();
    }
  }
  
  

  onObraChange(obra: any): void {
    this.selectedObra = obra;
    this.loadEmpleados(this.selectedSemana, this.selectedDia, obra);
  }

  onSearchChange() {
    this.filterEmpleados();
  }

  goBack() {
    this.router.navigate(['../']);
  }

  isFormValid(): boolean {
    return this.selectedSemana && this.selectedDia && this.selectedObra && this.selectedEmpleados.length > 0;
  }

  selectAllUnassignedEmployees(): void {
    this.filteredEmpleados.forEach((empleado) => {
      if (!empleado.isAssigned && !empleado.selected) {
        empleado.selected = true; // Marcar el empleado como seleccionado
        this.selectedEmpleados.push(empleado); // Añadir a la lista de seleccionados
      }
    });
  }
  
}
