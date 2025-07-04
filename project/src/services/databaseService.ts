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
   * Conecta con la base de datos usando el backend
   */
  async connect(): Promise<boolean> {
    const config = this.loadConfig();
    if (!config) {
      throw new Error('No hay configuración de base de datos');
    }

    const response = await fetch(
      `http://${config.host}:${config.port}/connect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      throw new Error('Error al conectar con la base de datos');
    }

    this.connected = true;
    return true;
  }

  /**
   * Obtener todos los trabajos/negocios de la tabla jobs
   */
  async getJobs(): Promise<Job[]> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    const config = this.loadConfig()!;
    const response = await fetch(
      `http://${config.host}:${config.port}/jobs?database=${config.database}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-username': config.username,
          'x-password': config.password
        }
      }
    );

    if (!response.ok) {
      throw new Error('No se pudieron obtener los trabajos');
    }

    const data = await response.json();
    return data as Job[];
  }

  /**
   * Crear un nuevo trabajo en la base de datos
   */
  async createJob(job: Omit<Job, 'id'>): Promise<Job> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    const config = this.loadConfig()!;
    const response = await fetch(
      `http://${config.host}:${config.port}/jobs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-username': config.username,
          'x-password': config.password,
          'x-database': config.database
        },
        body: JSON.stringify(job)
      }
    );

    if (!response.ok) {
      throw new Error('No se pudo crear el trabajo');
    }

    const data = await response.json();
    return data as Job;
  }

  /**
   * Actualizar un trabajo existente
   */
  async updateJob(id: number, updates: Partial<Job>): Promise<Job> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    const config = this.loadConfig()!;
    const response = await fetch(
      `http://${config.host}:${config.port}/jobs/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-username': config.username,
          'x-password': config.password,
          'x-database': config.database
        },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      throw new Error('No se pudo actualizar el trabajo');
    }

    const data = await response.json();
    return data as Job;
  }

  /**
   * Eliminar un trabajo
   */
  async deleteJob(id: number): Promise<void> {
    if (!this.hasValidConfig()) {
      throw new Error('Base de datos no configurada');
    }

    const config = this.loadConfig()!;
    const response = await fetch(
      `http://${config.host}:${config.port}/jobs/${id}`,
      {
        method: 'DELETE',
        headers: {
          'x-username': config.username,
          'x-password': config.password,
          'x-database': config.database
        }
      }
    );

    if (!response.ok) {
      throw new Error('No se pudo eliminar el trabajo');
    }
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

    const response = await fetch(
      `http://${config.host}:${config.port}/test-connection`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: 'Error al probar la conexión'
      };
    }

    return response.json();
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async getDatabaseStats(): Promise<{ jobs: number; connected: boolean }> {
    if (!this.hasValidConfig()) {
      return { jobs: 0, connected: false };
    }

    const config = this.loadConfig()!;
    const response = await fetch(
      `http://${config.host}:${config.port}/database-stats`,
      {
        headers: {
          'x-username': config.username,
          'x-password': config.password,
          'x-database': config.database
        }
      }
    );

    if (!response.ok) {
      return { jobs: 0, connected: false };
    }

    return response.json();
  }
}

export const databaseService = new DatabaseService();
