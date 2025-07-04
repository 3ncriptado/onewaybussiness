import { Business, Item, Sale, Statistics, WebhookConfig } from '../types';
import { webhookService } from './webhookService';

// Simulación de datos
let businesses: Business[] = [
  {
    id: 1,
    nombre: 'Mecánica Los Hermanos',
    tipo: 'mecanico',
    estado: 'vendido',
    comprador_nombre: 'Juan Pérez',
    comprador_id: 1001,
    fecha_venta: '2024-01-15T10:30:00Z',
    monto: 150000,
    fecha_creacion: '2024-01-01T08:00:00Z'
  },
  {
    id: 2,
    nombre: 'Restaurante El Sabor',
    tipo: 'comida',
    estado: 'disponible',
    monto: 200000,
    fecha_creacion: '2024-01-02T09:15:00Z'
  },
  {
    id: 3,
    nombre: 'TechStore Premium',
    tipo: 'telefonos',
    estado: 'vendido',
    comprador_nombre: 'María González',
    comprador_id: 1002,
    fecha_venta: '2024-01-20T14:45:00Z',
    monto: 180000,
    fecha_creacion: '2024-01-03T11:30:00Z'
  }
];

let items: Item[] = [
  {
    id: 1,
    nombre: 'Hamburguesa Clásica',
    negocio_id: 2,
    tipo: 'comestible',
    vencimiento_horas: 24,
    imagen: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
    fecha_creacion: '2024-01-02T10:00:00Z',
    label: 'Hamburguesa Clásica',
    weight: 115,
    stack: true,
    close: false,
    degrade: 30, // 30 minutos
    decay: false,
    description: 'Deliciosa hamburguesa del restaurante',
    original_id: 'hamburguesa_clasica' // ID original para mantener en exportación
  },
  {
    id: 2,
    nombre: 'Smartphone Pro',
    negocio_id: 3,
    tipo: 'otros',
    imagen: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
    fecha_creacion: '2024-01-03T12:00:00Z',
    label: 'Smartphone Pro',
    weight: 200,
    stack: false,
    close: true,
    degrade: 0, // Sin degradación
    decay: false,
    description: 'Teléfono inteligente de última generación',
    original_id: 'smartphone_pro' // ID original para mantener en exportación
  }
];

export const businessService = {
  getAll: async (): Promise<Business[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(businesses), 500);
    });
  },

  create: async (business: Omit<Business, 'id' | 'fecha_creacion'>): Promise<Business> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const newBusiness: Business = {
          ...business,
          id: Date.now(),
          fecha_creacion: new Date().toISOString()
        };
        businesses.push(newBusiness);
        resolve(newBusiness);
      }, 500);
    });
  },

  update: async (id: number, business: Partial<Business>): Promise<Business> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = businesses.findIndex(b => b.id === id);
        if (index === -1) {
          reject(new Error('Negocio no encontrado'));
          return;
        }
        businesses[index] = { ...businesses[index], ...business };
        resolve(businesses[index]);
      }, 500);
    });
  },

  delete: async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = businesses.findIndex(b => b.id === id);
        if (index === -1) {
          reject(new Error('Negocio no encontrado'));
          return;
        }
        businesses.splice(index, 1);
        resolve();
      }, 500);
    });
  }
};

export const itemService = {
  getByBusinessId: async (businessId: number): Promise<Item[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const businessItems = items.filter(item => item.negocio_id === businessId);
        resolve(businessItems);
      }, 300);
    });
  },

  create: async (item: Omit<Item, 'id' | 'fecha_creacion'>): Promise<Item> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const newItem: Item = {
          ...item,
          id: Date.now(),
          fecha_creacion: new Date().toISOString(),
          // Si no tiene original_id, generarlo basado en el nombre
          original_id: item.original_id || item.nombre?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        };
        items.push(newItem);
        resolve(newItem);
      }, 500);
    });
  },

  update: async (id: number, item: Partial<Item>): Promise<Item> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = items.findIndex(i => i.id === id);
        if (index === -1) {
          reject(new Error('Ítem no encontrado'));
          return;
        }
        items[index] = { ...items[index], ...item };
        resolve(items[index]);
      }, 500);
    });
  },

  delete: async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = items.findIndex(i => i.id === id);
        if (index === -1) {
          reject(new Error('Ítem no encontrado'));
          return;
        }
        items.splice(index, 1);
        resolve();
      }, 500);
    });
  }
};

export const salesService = {
  getAll: async (): Promise<Sale[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const sales = businesses
          .filter(b => b.estado === 'vendido' && b.comprador_nombre && b.fecha_venta)
          .map(b => ({
            id: b.id,
            negocio_id: b.id,
            negocio_nombre: b.nombre,
            comprador_nombre: b.comprador_nombre!,
            comprador_id: b.comprador_id!,
            monto: b.monto,
            fecha_venta: b.fecha_venta!
          }));
        resolve(sales);
      }, 500);
    });
  }
};

export const statisticsService = {
  get: async (): Promise<Statistics> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const stats: Statistics = {
          total_negocios: businesses.length,
          negocios_vendidos: businesses.filter(b => b.estado === 'vendido').length,
          negocios_disponibles: businesses.filter(b => b.estado === 'disponible').length,
          monto_total: businesses.reduce((sum, b) => sum + b.monto, 0),
          ventas_mes: businesses.filter(b => b.estado === 'vendido' && b.fecha_venta).length,
          items_totales: items.length
        };
        resolve(stats);
      }, 500);
    });
  }
};

// Servicio de webhooks actualizado para usar el nuevo sistema
export { webhookService };
