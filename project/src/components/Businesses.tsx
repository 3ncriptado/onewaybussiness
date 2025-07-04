import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Eye, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Job } from '../types';
import { databaseService } from '../services/databaseService';
import { webhookService } from '../services/webhookService';
import { useToast } from '../contexts/ToastContext';
import Layout from './Layout';

const Businesses: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [whitelistFilter, setWhitelistFilter] = useState<'all' | 'true' | 'false'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: '',
    whitelisted: false
  });

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, typeFilter, whitelistFilter]);

  const checkDatabaseConnection = async () => {
    const hasConfig = databaseService.hasValidConfig();
    if (!hasConfig) {
      setLoading(false);
      addToast({
        type: 'warning',
        title: 'Base de datos no configurada',
        message: 'Ve a Configuración → Base de Datos para configurar la conexión'
      });
      return;
    }

    await loadJobs();
  };

  const loadJobs = async () => {
    try {
      setConnecting(true);
      const data = await databaseService.getJobs();
      setJobs(data);
      setConnected(true);
      addToast({
        type: 'success',
        title: 'Conexión exitosa',
        message: `Se cargaron ${data.length} trabajos desde la base de datos`
      });
    } catch (error) {
      setConnected(false);
      addToast({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar a la base de datos'
      });
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.label?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.type === typeFilter);
    }

    if (whitelistFilter !== 'all') {
      const isWhitelisted = whitelistFilter === 'true';
      filtered = filtered.filter(job => job.whitelisted === isWhitelisted);
    }

    setFilteredJobs(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedJob) {
        const updatedJob = await databaseService.updateJob(selectedJob.id, formData);
        setJobs(prev => prev.map(j => j.id === selectedJob.id ? updatedJob : j));
        
        addToast({
          type: 'success',
          title: 'Trabajo actualizado',
          message: `${updatedJob.label || updatedJob.name} ha sido actualizado correctamente`
        });
      } else {
        const newJob = await databaseService.createJob(formData);
        setJobs(prev => [...prev, newJob]);
        
        addToast({
          type: 'success',
          title: 'Trabajo creado',
          message: `${newJob.label || newJob.name} ha sido creado correctamente`
        });
      }
      
      resetForm();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el trabajo'
      });
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      name: job.name,
      label: job.label || '',
      type: job.type || '',
      whitelisted: job.whitelisted || false
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (job: Job) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${job.label || job.name}?`)) {
      try {
        await databaseService.deleteJob(job.id);
        setJobs(prev => prev.filter(j => j.id !== job.id));
        
        addToast({
          type: 'success',
          title: 'Trabajo eliminado',
          message: `${job.label || job.name} ha sido eliminado correctamente`
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar el trabajo'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      type: '',
      whitelisted: false
    });
    setSelectedJob(null);
    setIsEditing(false);
    setShowModal(false);
  };

  const getJobTypes = () => {
    const types = new Set(jobs.map(job => job.type).filter(Boolean));
    return Array.from(types);
  };

  const getGradeCount = (job: Job): number => {
    if (!job.grades || typeof job.grades !== 'object') return 0;
    return Object.keys(job.grades).length;
  };

  if (loading) {
    return (
      <Layout currentPage="negocios">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {connecting ? 'Conectando a la base de datos...' : 'Cargando...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Si no hay configuración de base de datos
  if (!databaseService.hasValidConfig()) {
    return (
      <Layout currentPage="negocios">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Gestión de Trabajos</h1>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
            <h3 className="text-xl font-medium text-yellow-400 mb-2">
              Base de Datos No Configurada
            </h3>
            <p className="text-yellow-300 mb-6">
              Para gestionar los trabajos desde la base de datos, necesitas configurar la conexión primero.
            </p>
            <a
              href="#configuracion"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg gap-2"
            >
              <Database className="h-5 w-5" />
              Ir a Configuración
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="negocios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Gestión de Trabajos</h1>
            <div className="flex items-center gap-2">
              {connected ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Desconectado</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadJobs}
              disabled={connecting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${connecting ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Nuevo Trabajo
            </button>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Database className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="font-medium text-white">Base de Datos Conectada</h3>
                <p className="text-sm text-gray-400">
                  Mostrando trabajos desde la tabla "jobs"
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total de trabajos</p>
              <p className="text-xl font-bold text-white">{jobs.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar trabajos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all" className="bg-slate-800 text-gray-300">Todos los tipos</option>
                {getJobTypes().map(type => (
                  <option key={type} value={type} className="bg-slate-800 text-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Whitelist
              </label>
              <select
                value={whitelistFilter}
                onChange={(e) => setWhitelistFilter(e.target.value as 'all' | 'true' | 'false')}
                className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all" className="bg-slate-800 text-gray-300">Todos</option>
                <option value="true" className="bg-slate-800 text-white">Solo Whitelist</option>
                <option value="false" className="bg-slate-800 text-white">Sin Whitelist</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setWhitelistFilter('all');
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all border border-white/20"
              >
                <Filter className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Whitelist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Grados
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <code className="bg-slate-800 px-2 py-1 rounded text-blue-400">
                        {job.name}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {job.label || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {job.type ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {job.type}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        job.whitelisted 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {job.whitelisted ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-blue-400">{getGradeCount(job)}</span>
                        <span className="text-gray-400">grados</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(job)}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job)}
                          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No hay trabajos</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm || typeFilter !== 'all' || whitelistFilter !== 'all' 
                  ? 'No se encontraron trabajos con los filtros aplicados.' 
                  : 'No se encontraron trabajos en la base de datos.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl max-w-md w-full mx-4 border border-white/10 shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Editar Trabajo' : 'Nuevo Trabajo'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Trabajo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                    placeholder="ej: police, mechanic, taxi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Label (Nombre Mostrado)
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                    placeholder="ej: Policía, Mecánico, Taxi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                    placeholder="ej: leo, ems, mechanic"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="whitelisted"
                    checked={formData.whitelisted}
                    onChange={(e) => setFormData({ ...formData, whitelisted: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="whitelisted" className="ml-2 block text-sm text-gray-300">
                    Requiere Whitelist
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-300 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all shadow-lg"
                  >
                    {isEditing ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Businesses;
