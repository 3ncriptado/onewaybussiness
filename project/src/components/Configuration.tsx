import React, { useState, useEffect } from 'react';
import { Settings, User, Webhook, Key, Save, TestTube, Users, Link, Trash2, ToggleLeft, ToggleRight, Database, Server, HardDrive } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { webhookService } from '../services/webhookService';
import { databaseService } from '../services/databaseService';
import { DatabaseConfig } from '../types';
import Layout from './Layout';

interface WebhookConfig {
  id: number;
  tipo_evento: string;
  url: string;
  activo: boolean;
}

const Configuration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('webhooks');
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', permisos: 'admin', active: true },
    { id: 2, username: 'viewer', permisos: 'viewer', active: true },
  ]);
  const [newWebhook, setNewWebhook] = useState({ tipo_evento: '', url: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', permisos: 'viewer' });
  const [testingWebhook, setTestingWebhook] = useState<number | null>(null);
  const [testingDatabase, setTestingDatabase] = useState(false);
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({
    host: 'localhost',
    port: 3306,
    username: '',
    password: '',
    database: ''
  });
  const { addToast } = useToast();

  const tabs = [
    { id: 'webhooks', name: 'Webhooks', icon: Webhook, color: 'text-blue-400' },
    { id: 'database', name: 'Base de Datos', icon: Database, color: 'text-green-400' },
    { id: 'users', name: 'Usuarios', icon: Users, color: 'text-purple-400' },
    { id: 'system', name: 'Sistema', icon: Settings, color: 'text-orange-400' },
  ];

  const eventTypes = [
    { value: 'negocio_creado', label: 'Negocio Creado', color: 'text-green-400' },
    { value: 'negocio_editado', label: 'Negocio Editado', color: 'text-blue-400' },
    { value: 'venta_realizada', label: 'Venta Realizada', color: 'text-yellow-400' },
    { value: 'item_creado', label: 'Item Creado', color: 'text-purple-400' },
  ];

  useEffect(() => {
    loadWebhooks();
    loadDatabaseConfig();
  }, []);

  const loadWebhooks = () => {
    const loadedWebhooks = webhookService.loadWebhooks();
    setWebhooks(loadedWebhooks);
  };

  const loadDatabaseConfig = () => {
    const saved = localStorage.getItem('database_config');
    if (saved) {
      setDatabaseConfig(JSON.parse(saved));
    }
  };

  const saveDatabaseConfig = () => {
    localStorage.setItem('database_config', JSON.stringify(databaseConfig));
    addToast({
      type: 'success',
      title: 'Configuración guardada',
      message: 'La configuración de la base de datos ha sido guardada'
    });
  };

  const testDatabaseConnection = async () => {
    setTestingDatabase(true);
    addToast({
      type: 'info',
      title: 'Probando conexión',
      message: 'Verificando conexión a la base de datos...'
    });

    try {
      const result = await databaseService.testConnection();
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Conexión exitosa',
          message: result.message
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error de conexión',
          message: result.message
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar a la base de datos'
      });
    } finally {
      setTestingDatabase(false);
    }
  };

  const handleSaveWebhook = () => {
    if (!newWebhook.tipo_evento || !newWebhook.url) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Todos los campos son requeridos'
      });
      return;
    }

    // Validar URL
    try {
      new URL(newWebhook.url);
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'La URL del webhook no es válida'
      });
      return;
    }

    const webhook = webhookService.addWebhook({
      ...newWebhook,
      activo: true
    });

    setWebhooks(prev => [...prev, webhook]);
    setNewWebhook({ tipo_evento: '', url: '' });
    
    addToast({
      type: 'success',
      title: 'Webhook guardado',
      message: 'El webhook ha sido configurado correctamente'
    });
  };

  const handleSaveUser = () => {
    if (!newUser.username || !newUser.password) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Todos los campos son requeridos'
      });
      return;
    }

    const user = {
      id: Date.now(),
      username: newUser.username,
      permisos: newUser.permisos as 'admin' | 'viewer',
      active: true
    };

    setUsers([...users, user]);
    setNewUser({ username: '', password: '', permisos: 'viewer' });
    
    addToast({
      type: 'success',
      title: 'Usuario creado',
      message: 'El usuario ha sido creado correctamente'
    });
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    setTestingWebhook(webhook.id);
    
    try {
      const success = await webhookService.testWebhook(webhook.url);
      
      if (success) {
        addToast({
          type: 'success',
          title: 'Webhook enviado',
          message: `Webhook de prueba enviado correctamente a ${webhook.tipo_evento}`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error en webhook',
          message: 'No se pudo enviar el webhook. Verifica la URL.'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Error al enviar el webhook de prueba'
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  const toggleWebhook = (id: number) => {
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) return;

    const updated = webhookService.updateWebhook(id, { activo: !webhook.activo });
    if (updated) {
      setWebhooks(prev => prev.map(w => w.id === id ? updated : w));
      addToast({
        type: 'info',
        title: 'Webhook actualizado',
        message: `Webhook ${updated.activo ? 'activado' : 'desactivado'}`
      });
    }
  };

  const deleteWebhook = (id: number) => {
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) return;

    if (window.confirm(`¿Estás seguro de eliminar el webhook de ${webhook.tipo_evento}?`)) {
      const deleted = webhookService.deleteWebhook(id);
      if (deleted) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        addToast({
          type: 'success',
          title: 'Webhook eliminado',
          message: 'El webhook ha sido eliminado correctamente'
        });
      }
    }
  };

  const getEventTypeInfo = (eventType: string) => {
    return eventTypes.find(et => et.value === eventType) || { label: eventType, color: 'text-gray-400' };
  };

  // Función para truncar URLs largas
  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    
    const start = url.substring(0, 20);
    const end = url.substring(url.length - 20);
    return `${start}...${end}`;
  };

  return (
    <Layout currentPage="configuracion">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/10">
          <div className="border-b border-white/10">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/20'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-400' : tab.color}`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Configuración de Webhooks Discord
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Configura las URLs de Discord para recibir notificaciones automáticas de eventos del sistema.
                    Los webhooks se envían en tiempo real cuando ocurren los eventos.
                  </p>
                </div>

                {/* Add Webhook Form */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="font-medium text-white mb-4">Agregar Nuevo Webhook</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tipo de Evento
                      </label>
                      <select
                        value={newWebhook.tipo_evento}
                        onChange={(e) => setNewWebhook({ ...newWebhook, tipo_evento: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                        style={{
                          colorScheme: 'dark'
                        }}
                      >
                        <option value="" className="bg-slate-800 text-gray-300">Seleccionar evento</option>
                        {eventTypes.map(type => (
                          <option key={type.value} value={type.value} className="bg-slate-800 text-white">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        URL del Webhook
                      </label>
                      <input
                        type="url"
                        value={newWebhook.url}
                        onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleSaveWebhook}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                      >
                        <Save className="h-4 w-4" />
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Webhooks List */}
                <div className="space-y-4">
                  {webhooks.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                      <Webhook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No hay webhooks configurados</h3>
                      <p className="text-gray-400">Agrega tu primer webhook para recibir notificaciones.</p>
                    </div>
                  ) : (
                    webhooks.map((webhook) => {
                      const eventInfo = getEventTypeInfo(webhook.tipo_evento);
                      return (
                        <div key={webhook.id} className="border border-white/10 rounded-xl p-4 bg-white/5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                  webhook.activo
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}>
                                  {webhook.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <h4 className={`font-medium ${eventInfo.color}`}>
                                  {eventInfo.label}
                                </h4>
                              </div>
                              <div className="group relative">
                                <p className="text-sm text-gray-400 font-mono break-all">
                                  {truncateUrl(webhook.url)}
                                </p>
                                {/* Tooltip con URL completa */}
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-white/20 max-w-md break-all">
                                    {webhook.url}
                                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => testWebhook(webhook)}
                                disabled={testingWebhook === webhook.id}
                                className="text-blue-400 hover:text-blue-300 p-2 rounded transition-colors disabled:opacity-50"
                                title="Probar webhook"
                              >
                                {testingWebhook === webhook.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                ) : (
                                  <TestTube className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => toggleWebhook(webhook.id)}
                                className={`p-2 rounded transition-colors ${
                                  webhook.activo
                                    ? 'text-yellow-400 hover:text-yellow-300'
                                    : 'text-green-400 hover:text-green-300'
                                }`}
                                title={webhook.activo ? 'Desactivar' : 'Activar'}
                              >
                                {webhook.activo ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => deleteWebhook(webhook.id)}
                                className="text-red-400 hover:text-red-300 p-2 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Webhook Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Link className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-400">
                        Cómo obtener una URL de Webhook de Discord
                      </h3>
                      <div className="mt-2 text-sm text-blue-300">
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Ve a tu servidor de Discord y selecciona un canal</li>
                          <li>Haz clic en "Editar Canal" → "Integraciones" → "Webhooks"</li>
                          <li>Crea un nuevo webhook y copia la URL</li>
                          <li>Pega la URL aquí y selecciona el tipo de evento</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Configuración de Base de Datos
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Configura los parámetros de conexión a la base de datos del sistema.
                    Esta configuración se usa para conectar con la tabla "jobs" y gestionar los trabajos.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Host
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/20 bg-white/5 text-gray-400 text-sm">
                          <Server className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          value={databaseConfig.host}
                          onChange={(e) => setDatabaseConfig({ ...databaseConfig, host: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="localhost"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Puerto
                      </label>
                      <input
                        type="number"
                        value={databaseConfig.port}
                        onChange={(e) => setDatabaseConfig({ ...databaseConfig, port: parseInt(e.target.value) || 3306 })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                        placeholder="3306"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre de la Base de Datos
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/20 bg-white/5 text-gray-400 text-sm">
                          <HardDrive className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          value={databaseConfig.database}
                          onChange={(e) => setDatabaseConfig({ ...databaseConfig, database: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="es_extended"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Usuario
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/20 bg-white/5 text-gray-400 text-sm">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          value={databaseConfig.username}
                          onChange={(e) => setDatabaseConfig({ ...databaseConfig, username: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="root"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contraseña
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/20 bg-white/5 text-gray-400 text-sm">
                          <Key className="h-4 w-4" />
                        </span>
                        <input
                          type="password"
                          value={databaseConfig.password}
                          onChange={(e) => setDatabaseConfig({ ...databaseConfig, password: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={testDatabaseConnection}
                      disabled={testingDatabase}
                      className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {testingDatabase ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      {testingDatabase ? 'Probando...' : 'Probar Conexión'}
                    </button>
                    <button
                      onClick={saveDatabaseConfig}
                      className="px-4 py-2 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all shadow-lg flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar Configuración
                    </button>
                  </div>
                </div>

                {/* Database Info */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Database className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-400">
                        Información sobre la Conexión
                      </h3>
                      <div className="mt-2 text-sm text-green-300">
                        <p>
                          El sistema se conectará a la tabla <code className="bg-green-900/30 px-1 rounded">jobs</code> para 
                          obtener la lista de trabajos disponibles. Asegúrate de que la base de datos tenga esta tabla.
                        </p>
                        <p className="mt-2">
                          <strong>Campos requeridos en la tabla jobs:</strong> id, name, label, type, whitelisted, grades
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Gestión de Usuarios
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Administra los usuarios del sistema y sus permisos.
                  </p>
                </div>

                {/* Add User Form */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="font-medium text-white mb-4">Crear Nuevo Usuario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Usuario
                      </label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Nombre de usuario"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Contraseña"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Permisos
                      </label>
                      <select
                        value={newUser.permisos}
                        onChange={(e) => setNewUser({ ...newUser, permisos: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                        style={{
                          colorScheme: 'dark'
                        }}
                      >
                        <option value="viewer" className="bg-slate-800 text-white">Viewer</option>
                        <option value="admin" className="bg-slate-800 text-white">Admin</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleSaveUser}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                      >
                        <Save className="h-4 w-4" />
                        Crear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border border-white/10 rounded-xl p-4 bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{user.username}</h4>
                            <p className="text-sm text-gray-400 capitalize">{user.permisos}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                            user.active
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Configuración del Sistema
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Ajustes generales y configuraciones del sistema.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-medium text-white mb-4">Información del Sistema</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Versión:</span>
                        <span className="text-sm font-medium text-white">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Última actualización:</span>
                        <span className="text-sm font-medium text-white">2024-01-25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Estado:</span>
                        <span className="text-sm font-medium text-green-400">Activo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Webhooks configurados:</span>
                        <span className="text-sm font-medium text-white">{webhooks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Webhooks activos:</span>
                        <span className="text-sm font-medium text-green-400">
                          {webhooks.filter(w => w.activo).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-medium text-white mb-4">Base de Datos</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Conexión:</span>
                        <span className={`text-sm font-medium ${databaseService.hasValidConfig() ? 'text-green-400' : 'text-red-400'}`}>
                          {databaseService.hasValidConfig() ? 'Configurado' : 'No configurado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Tipo:</span>
                        <span className="text-sm font-medium text-white">MySQL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Host:</span>
                        <span className="text-sm font-medium text-white">{databaseConfig.host || 'No configurado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Base de datos:</span>
                        <span className="text-sm font-medium text-white">{databaseConfig.database || 'No configurado'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Key className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-400">
                        Configuración de Seguridad
                      </h3>
                      <div className="mt-2 text-sm text-yellow-300">
                        <p>
                          Recuerda cambiar las contraseñas por defecto y configurar un sistema de backup regular.
                          Los webhooks se almacenan localmente en el navegador.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Configuration;
