export interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
    footer?: {
      text: string;
      icon_url?: string;
    };
  }>;
}

export interface WebhookConfig {
  id: number;
  tipo_evento: string;
  url: string;
  activo: boolean;
}

class WebhookService {
  private webhooks: WebhookConfig[] = [];

  // Cargar webhooks desde localStorage
  loadWebhooks(): WebhookConfig[] {
    const saved = localStorage.getItem('oneway_webhooks');
    if (saved) {
      this.webhooks = JSON.parse(saved);
    }
    return this.webhooks;
  }

  // Guardar webhooks en localStorage
  saveWebhooks(): void {
    localStorage.setItem('oneway_webhooks', JSON.stringify(this.webhooks));
  }

  // Agregar nuevo webhook
  addWebhook(webhook: Omit<WebhookConfig, 'id'>): WebhookConfig {
    const newWebhook: WebhookConfig = {
      ...webhook,
      id: Date.now()
    };
    this.webhooks.push(newWebhook);
    this.saveWebhooks();
    return newWebhook;
  }

  // Actualizar webhook
  updateWebhook(id: number, updates: Partial<WebhookConfig>): WebhookConfig | null {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return null;
    
    this.webhooks[index] = { ...this.webhooks[index], ...updates };
    this.saveWebhooks();
    return this.webhooks[index];
  }

  // Eliminar webhook
  deleteWebhook(id: number): boolean {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;
    
    this.webhooks.splice(index, 1);
    this.saveWebhooks();
    return true;
  }

  // Obtener webhooks por tipo de evento
  getWebhooksByEvent(eventType: string): WebhookConfig[] {
    return this.webhooks.filter(w => w.tipo_evento === eventType && w.activo);
  }

  // Enviar webhook a una URL específica
  async sendToUrl(url: string, payload: WebhookPayload): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Error enviando webhook:', error);
      return false;
    }
  }

  // Enviar webhook por tipo de evento
  async sendWebhook(eventType: string, data: any): Promise<{ success: number; failed: number }> {
    const webhooks = this.getWebhooksByEvent(eventType);
    let success = 0;
    let failed = 0;

    const payload = this.createPayload(eventType, data);

    for (const webhook of webhooks) {
      const sent = await this.sendToUrl(webhook.url, payload);
      if (sent) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // Crear payload según el tipo de evento
  private createPayload(eventType: string, data: any): WebhookPayload {
    const timestamp = new Date().toISOString();
    const colors = {
      negocio_creado: 0x22C55E, // Verde
      negocio_editado: 0x3B82F6, // Azul
      venta_realizada: 0xEAB308, // Amarillo
      item_creado: 0xA855F7, // Morado
      test: 0xF97316 // Naranja
    };

    const basePayload: WebhookPayload = {
      username: 'OneWay Business - Sistema de Gestión',
      avatar_url: 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?auto=compress&cs=tinysrgb&w=64',
      embeds: [{
        timestamp,
        footer: {
          text: 'OneWay Business - Sistema de Gestión',
        }
      }]
    };

    switch (eventType) {
      case 'negocio_creado':
        basePayload.embeds![0] = {
          ...basePayload.embeds![0],
          title: '🏢 Nuevo Negocio Creado',
          description: `Se ha creado un nuevo negocio: **${data.negocio.nombre}**`,
          color: colors.negocio_creado,
          fields: [
            { name: '📋 Nombre', value: data.negocio.nombre, inline: true },
            { name: '🏷️ Tipo', value: data.negocio.tipo, inline: true },
            { name: '💰 Monto', value: `RD$ ${data.negocio.monto.toLocaleString()}`, inline: true },
            { name: '📊 Estado', value: data.negocio.estado, inline: true },
            { name: '👤 Usuario', value: data.usuario, inline: true },
            { name: '📅 Fecha', value: new Date().toLocaleString('es-DO'), inline: true }
          ]
        };
        break;

      case 'negocio_editado':
        basePayload.embeds![0] = {
          ...basePayload.embeds![0],
          title: '✏️ Negocio Actualizado',
          description: `Se ha actualizado el negocio: **${data.negocio.nombre}**`,
          color: colors.negocio_editado,
          fields: [
            { name: '📋 Nombre', value: data.negocio.nombre, inline: true },
            { name: '🏷️ Tipo', value: data.negocio.tipo, inline: true },
            { name: '💰 Monto', value: `RD$ ${data.negocio.monto.toLocaleString()}`, inline: true },
            { name: '📊 Estado', value: data.negocio.estado, inline: true },
            { name: '👤 Usuario', value: data.usuario, inline: true },
            { name: '📅 Fecha', value: new Date().toLocaleString('es-DO'), inline: true }
          ]
        };
        if (data.negocio.comprador_nombre) {
          basePayload.embeds![0].fields!.push({
            name: '🛒 Comprador',
            value: data.negocio.comprador_nombre,
            inline: true
          });
        }
        break;

      case 'venta_realizada':
        basePayload.embeds![0] = {
          ...basePayload.embeds![0],
          title: '💰 Venta Realizada',
          description: `Se ha vendido el negocio: **${data.negocio}**`,
          color: colors.venta_realizada,
          fields: [
            { name: '🏢 Negocio', value: data.negocio, inline: true },
            { name: '👤 Comprador', value: data.comprador, inline: true },
            { name: '💰 Monto', value: `RD$ ${data.monto.toLocaleString()}`, inline: true },
            { name: '🆔 ID Comprador', value: data.comprador_id?.toString() || 'N/A', inline: true },
            { name: '👨‍💼 Usuario', value: data.usuario, inline: true },
            { name: '📅 Fecha', value: new Date().toLocaleString('es-DO'), inline: true }
          ]
        };
        break;

      case 'item_creado':
        basePayload.embeds![0] = {
          ...basePayload.embeds![0],
          title: '📦 Nuevo Ítem Creado',
          description: `Se ha creado un nuevo ítem: **${data.item.nombre}**`,
          color: colors.item_creado,
          fields: [
            { name: '📦 Ítem', value: data.item.nombre, inline: true },
            { name: '🏢 Negocio', value: data.negocio, inline: true },
            { name: '🏷️ Tipo', value: data.item.tipo, inline: true },
            { name: '👤 Usuario', value: data.usuario, inline: true },
            { name: '📅 Fecha', value: new Date().toLocaleString('es-DO'), inline: true }
          ]
        };
        if (data.item.vencimiento_horas) {
          basePayload.embeds![0].fields!.push({
            name: '⏰ Vencimiento',
            value: `${data.item.vencimiento_horas} horas`,
            inline: true
          });
        }
        break;

      case 'test':
        basePayload.embeds![0] = {
          ...basePayload.embeds![0],
          title: '🧪 Webhook de Prueba',
          description: 'Este es un mensaje de prueba del sistema de webhooks.',
          color: colors.test,
          fields: [
            { name: '✅ Estado', value: 'Funcionando correctamente', inline: true },
            { name: '🔧 Sistema', value: 'OneWay Business Management', inline: true },
            { name: '📅 Fecha', value: new Date().toLocaleString('es-DO'), inline: true }
          ]
        };
        break;

      default:
        basePayload.embeds![0] = {
          ...basePayload.embeds![0],
          title: '📢 Evento del Sistema',
          description: `Evento: ${eventType}`,
          color: 0x6B7280,
          fields: [
            { name: '📋 Tipo', value: eventType, inline: true },
            { name: '📅 Fecha', value: new Date().toLocaleString('es-DO'), inline: true }
          ]
        };
    }

    return basePayload;
  }

  // Probar webhook
  async testWebhook(url: string): Promise<boolean> {
    const testPayload = this.createPayload('test', {});
    return await this.sendToUrl(url, testPayload);
  }
}

export const webhookService = new WebhookService();
