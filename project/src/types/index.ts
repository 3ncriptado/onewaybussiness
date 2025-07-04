export interface Business {
  id: number;
  nombre: string;
  tipo: BusinessType;
  estado: 'disponible' | 'vendido';
  comprador_nombre?: string;
  comprador_id?: number;
  fecha_venta?: string;
  monto: number;
  fecha_creacion: string;
}

export interface Item {
  id: number;
  nombre: string;
  negocio_id: number;
  tipo: 'comestible' | 'otros';
  vencimiento_horas?: number;
  imagen: string;
  fecha_creacion: string;
  metadata?: any; // Para almacenar propiedades adicionales de importación
  // Nuevos campos editables
  label?: string;
  weight?: number;
  stack?: boolean;
  degrade?: number; // Cambiado a number (minutos)
  decay?: boolean;
  close?: boolean;
  description?: string;
  // Campo para mantener el ID original del item
  original_id?: string;
}

export interface User {
  id: number;
  username: string;
  permisos: 'admin' | 'viewer';
}

export interface Sale {
  id: number;
  negocio_id: number;
  negocio_nombre: string;
  comprador_nombre: string;
  comprador_id: number;
  monto: number;
  fecha_venta: string;
}

export interface WebhookConfig {
  id: number;
  tipo_evento: string;
  url: string;
  activo: boolean;
}

export interface Statistics {
  total_negocios: number;
  negocios_vendidos: number;
  negocios_disponibles: number;
  monto_total: number;
  ventas_mes: number;
  items_totales: number;
}

export interface DatabaseConfig {
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

export type BusinessType = 'mecanico' | 'comida' | 'telefonos' | 'electronicos' | 'ferreteria' | 'decoracion';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
