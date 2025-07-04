import { DatabaseConfig } from '../types';

export interface DatabaseConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface Job {
  id: number;
  name: string;
  label?: string;
  type?: string;
  whitelisted?: boolean;
  grades?: any;
  // Permitir propiedades adicionales
  [key: string]: any;
}

class DatabaseService {
  private config: DatabaseConfig | null = null;
  private connected: boolean = false;

  /**
   * Cargar configuración de la base de datos
   */
  loadConfig(): DatabaseConfig | null {
    const saved = localStorage.getItem('database_config');
    if (saved) {
      this.config = JSON.parse(saved);
      return this.config;
    }
    return null;
  }

  /**
   * Verificar si hay configuración válida
   */
  hasValidConfig(): boolean {
    const config = this.loadConfig();
    return !!(config?.host && config?.username && config?.database);
  }

  /**
   * Simular conexión a la base de datos
   * En un entorno real, esto se haría a través de una API backend
   */
  async connect(): Promise<boolean> {
    const config = this.loadConfig();
    if (!config) {
      throw new Error('No hay configuración de base de datos');
    }

    // Simular conexión
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Obtener todos los trabajos/negocios de la tabla jobs
   */
  async getJobs(): Promise<Job[]> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    // Simular consulta a la base de datos
    // En un entorno real, esto sería una llamada a tu API backend
    return new Promise((resolve) => {
      setTimeout(() => {
        // Datos de ejemplo que simularían venir de tu tabla jobs
        const jobs: Job[] = [
          {
            id: 1,
            name: 'police',
            label: 'Policía',
            type: 'leo',
            whitelisted: true,
            grades: {
              '0': { name: 'recruit', label: 'Recluta', payment: 50 },
              '1': { name: 'officer', label: 'Oficial', payment: 75 },
              '2': { name: 'sergeant', label: 'Sargento', payment: 100 }
            }
          },
          {
            id: 2,
            name: 'ambulance',
            label: 'EMS',
            type: 'ems',
            whitelisted: true,
            grades: {
              '0': { name: 'trainee', label: 'Aprendiz', payment: 50 },
              '1': { name: 'paramedic', label: 'Paramédico', payment: 75 }
            }
          },
          {
            id: 3,
            name: 'mechanic',
            label: 'Mecánico',
            type: 'mechanic',
            whitelisted: false,
            grades: {
              '0': { name: 'employee', label: 'Empleado', payment: 50 },
              '1': { name: 'experienced', label: 'Experimentado', payment: 75 },
              '2': { name: 'advanced', label: 'Avanzado', payment: 100 },
              '3': { name: 'boss', label: 'Jefe', payment: 150 }
            }
          },
          {
            id: 4,
            name: 'taxi',
            label: 'Taxi',
            type: 'taxi',
            whitelisted: false,
            grades: {
              '0': { name: 'driver', label: 'Conductor', payment: 50 },
              '1': { name: 'boss', label: 'Jefe', payment: 100 }
            }
          },
          {
            id: 5,
            name: 'burgershot',
            label: 'Burger Shot',
            type: 'restaurant',
            whitelisted: false,
            grades: {
              '0': { name: 'employee', label: 'Empleado', payment: 50 },
              '1': { name: 'manager', label: 'Gerente', payment: 75 },
              '2': { name: 'boss', label: 'Jefe', payment: 100 }
            }
          },
          {
            id: 6,
            name: 'realestate',
            label: 'Bienes Raíces',
            type: 'realestate',
            whitelisted: true,
            grades: {
              '0': { name: 'agent', label: 'Agente', payment: 75 },
              '1': { name: 'boss', label: 'Jefe', payment: 150 }
            }
          }
        ];
        resolve(jobs);
      }, 800);
    });
  }

  /**
   * Crear un nuevo trabajo en la base de datos
   */
  async createJob(job: Omit<Job, 'id'>): Promise<Job> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const newJob: Job = {
          ...job,
          id: Date.now()
        };
        resolve(newJob);
      }, 500);
    });
  }

  /**
   * Actualizar un trabajo existente
   */
  async updateJob(id: number, updates: Partial<Job>): Promise<Job> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular actualización
        const updatedJob: Job = {
          id,
          name: 'updated_job',
          ...updates
        };
        resolve(updatedJob);
      }, 500);
    });
  }

  /**
   * Eliminar un trabajo
   */
  async deleteJob(id: number): Promise<void> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }

  /**
   * Probar la conexión a la base de datos
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = this.loadConfig();
    if (!config) {
      return {
        success: false,
        message: 'No hay configuración de base de datos'
      };
    }

    if (!config.host || !config.username || !config.database) {
      return {
        success: false,
        message: 'Faltan datos de configuración requeridos'
      };
    }

    // Simular prueba de conexión
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Conexión exitosa a ${config.database} en ${config.host}:${config.port}`
        });
      }, 2000);
    });
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async getDatabaseStats(): Promise<{ jobs: number; connected: boolean }> {
    if (!this.hasValidConfig()) {
      return { jobs: 0, connected: false };
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          jobs: 6, // Número simulado de trabajos
          connected: this.connected
        });
      }, 300);
    });
  }
}

export const databaseService = new DatabaseService();