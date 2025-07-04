import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Package, Clock, Image, Upload, Download, Eye, Copy, Code } from 'lucide-react';
import { Item, Business } from '../types';
import { itemService, businessService } from '../services/api';
import { webhookService } from '../services/webhookService';
import { itemImportService, ImportedItem } from '../services/itemImportService';
import { useToast } from '../contexts/ToastContext';
import Layout from './Layout';

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessFilter, setBusinessFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'comestible' | 'otros'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importedItems, setImportedItems] = useState<ImportedItem[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [exportCode, setExportCode] = useState('');
  const [processingImport, setProcessingImport] = useState(false);
  const [liveCode, setLiveCode] = useState(''); // Para mostrar el código en vivo
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    negocio_id: 0,
    tipo: 'comestible' as 'comestible' | 'otros',
    vencimiento_horas: 24,
    imagen: '',
    // Nuevos campos
    label: '',
    weight: 0,
    stack: false,
    degrade: 0,
    decay: false,
    close: false,
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, businessFilter, typeFilter]);

  // Efecto para actualizar el código en vivo cuando cambian los datos del formulario
  useEffect(() => {
    if (showModal) {
      updateLiveCode();
    }
  }, [formData, showModal, selectedItem]);

  const updateLiveCode = () => {
    // Crear un item temporal con los datos actuales del formulario
    const tempItem = {
      ...formData,
      id: selectedItem?.id || Date.now(),
      fecha_creacion: selectedItem?.fecha_creacion || new Date().toISOString(),
      // Preservar metadata si existe
      metadata: selectedItem?.metadata,
      original_id: selectedItem?.original_id || itemImportService.generateItemId(formData.nombre || 'new_item')
    };

    // Generar el código
    const code = itemImportService.generateItemCode(tempItem);
    setLiveCode(code);
  };

  const loadData = async () => {
    try {
      const [businessData] = await Promise.all([
        businessService.getAll()
      ]);
      setBusinesses(businessData);
      
      // Cargar todos los ítems de todos los negocios
      const allItems: Item[] = [];
      for (const business of businessData) {
        const businessItems = await itemService.getByBusinessId(business.id);
        allItems.push(...businessItems);
      }
      setItems(allItems);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.label?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (businessFilter !== 'all') {
      filtered = filtered.filter(item => item.negocio_id === businessFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.tipo === typeFilter);
    }

    setFilteredItems(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.negocio_id) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar un negocio'
      });
      return;
    }

    try {
      if (isEditing && selectedItem) {
        const updatedItem = await itemService.update(selectedItem.id, {
          ...formData,
          vencimiento_horas: formData.tipo === 'comestible' ? formData.vencimiento_horas : undefined,
          // Preservar metadata y original_id
          metadata: selectedItem.metadata,
          original_id: selectedItem.original_id
        });
        
        setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
        
        addToast({
          type: 'success',
          title: 'Ítem actualizado',
          message: `${updatedItem.nombre} ha sido actualizado correctamente`
        });
      } else {
        const newItem = await itemService.create({
          ...formData,
          vencimiento_horas: formData.tipo === 'comestible' ? formData.vencimiento_horas : undefined
        });
        
        setItems(prev => [...prev, newItem]);
        
        const business = businesses.find(b => b.id === formData.negocio_id);
        
        // Enviar webhook
        const result = await webhookService.sendWebhook('item_creado', {
          item: newItem,
          negocio: business?.nombre,
          usuario: 'admin'
        });
        
        addToast({
          type: 'success',
          title: 'Ítem creado',
          message: `${newItem.nombre} ha sido creado correctamente`
        });

        if (result.success > 0) {
          addToast({
            type: 'info',
            title: 'Webhook enviado',
            message: `Notificación enviada a ${result.success} webhook(s)`
          });
        }
      }
      
      resetForm();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el ítem'
      });
    }
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      nombre: item.nombre,
      negocio_id: item.negocio_id,
      tipo: item.tipo,
      vencimiento_horas: item.vencimiento_horas || 24,
      imagen: item.imagen,
      label: item.label || item.nombre,
      weight: item.weight || 0,
      stack: item.stack || false,
      degrade: item.degrade || 0,
      decay: item.decay || false,
      close: item.close || false,
      description: item.description || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (item: Item) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${item.nombre}?`)) {
      try {
        await itemService.delete(item.id);
        setItems(prev => prev.filter(i => i.id !== item.id));
        
        addToast({
          type: 'success',
          title: 'Ítem eliminado',
          message: `${item.nombre} ha sido eliminado correctamente`
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar el ítem'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      negocio_id: 0,
      tipo: 'comestible',
      vencimiento_horas: 24,
      imagen: '',
      label: '',
      weight: 0,
      stack: false,
      degrade: 0,
      decay: false,
      close: false,
      description: ''
    });
    setSelectedItem(null);
    setIsEditing(false);
    setShowModal(false);
    setLiveCode('');
  };

  const handleImport = async () => {
    if (!importContent.trim()) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Debes pegar el contenido a importar'
      });
      return;
    }

    setProcessingImport(true);

    try {
      const result = itemImportService.processImport(importContent);
      
      if (result.success && result.items.length > 0) {
        setImportedItems(result.items);
        setImportErrors(result.errors);
        setImportWarnings(result.warnings);
        
        // AQUÍ ES DONDE AGREGAMOS LOS ITEMS A LA BASE DE DATOS
        const createdItems: Item[] = [];
        let successCount = 0;
        let errorCount = 0;

        // Obtener el primer negocio disponible como fallback
        const defaultBusiness = businesses.length > 0 ? businesses[0] : null;
        
        if (!defaultBusiness) {
          addToast({
            type: 'error',
            title: 'Error',
            message: 'No hay negocios disponibles. Crea un negocio primero.'
          });
          return;
        }

        for (const importedItem of result.items) {
          try {
            // Convertir el item importado al formato del sistema
            const newItem = await itemService.create({
              nombre: importedItem.nombre,
              negocio_id: defaultBusiness.id, // Asignar al primer negocio disponible
              tipo: 'otros', // Por defecto, el usuario puede cambiar después
              vencimiento_horas: undefined,
              imagen: importedItem.image || '',
              // Propiedades adicionales del sistema
              label: importedItem.label || importedItem.nombre,
              weight: importedItem.weight || 0,
              stack: importedItem.stack || false,
              degrade: importedItem.degrade || 0,
              decay: importedItem.decay || false,
              close: importedItem.close || false,
              description: importedItem.description || '',
              // Preservar el ID original y todas las propiedades adicionales
              original_id: importedItem.id,
              metadata: importedItem // Guardar todas las propiedades originales
            });

            createdItems.push(newItem);
            successCount++;
          } catch (error) {
            console.error(`Error creando item ${importedItem.id}:`, error);
            errorCount++;
          }
        }

        // Actualizar la lista de items
        setItems(prev => [...prev, ...createdItems]);

        // Limpiar el modal de importación
        setImportContent('');
        setImportedItems([]);
        setImportErrors([]);
        setImportWarnings([]);
        setShowImportModal(false);

        // Mostrar resultado
        if (successCount > 0) {
          addToast({
            type: 'success',
            title: 'Importación exitosa',
            message: `Se importaron ${successCount} items correctamente${errorCount > 0 ? ` (${errorCount} errores)` : ''}`
          });

          // Enviar webhook de importación masiva
          const webhookResult = await webhookService.sendWebhook('item_creado', {
            item: { nombre: `${successCount} items importados` },
            negocio: defaultBusiness.nombre,
            usuario: 'admin'
          });

          if (webhookResult.success > 0) {
            addToast({
              type: 'info',
              title: 'Webhook enviado',
              message: `Notificación de importación enviada a ${webhookResult.success} webhook(s)`
            });
          }
        }

        if (errorCount > 0) {
          addToast({
            type: 'warning',
            title: 'Importación con errores',
            message: `${errorCount} items no pudieron ser importados`
          });
        }

      } else {
        setImportErrors(result.errors);
        setImportWarnings(result.warnings);
        
        addToast({
          type: 'error',
          title: 'Error en importación',
          message: result.errors[0] || 'Error desconocido'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Error inesperado durante la importación'
      });
    } finally {
      setProcessingImport(false);
    }
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      addToast({
        type: 'warning',
        title: 'Sin items',
        message: 'No hay items para exportar'
      });
      return;
    }

    const code = itemImportService.generateMultipleItemsCode(filteredItems);
    setExportCode(code);
    setShowExportModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        type: 'success',
        title: 'Copiado',
        message: 'Código copiado al portapapeles'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo copiar al portapapeles'
      });
    }
  };

  const getBusinessName = (businessId: number) => {
    const business = businesses.find(b => b.id === businessId);
    return business?.nombre || 'Negocio no encontrado';
  };

  const getAdditionalPropertiesCount = (item: Item) => {
    const managedProperties = new Set(['id', 'nombre', 'negocio_id', 'tipo', 'vencimiento_horas', 'imagen', 'fecha_creacion', 'label', 'weight', 'stack', 'degrade', 'decay', 'close', 'description', 'original_id']);
    
    if (!item.metadata) return 0;
    
    return Object.keys(item.metadata).filter(key => !managedProperties.has(key)).length;
  };

  if (loading) {
    return (
      <Layout currentPage="items">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="items">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Gestión de Ítems</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Upload className="h-4 w-4" />
              Importar
            </button>
            <button
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Nuevo Ítem
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Ítems</p>
                <p className="text-2xl font-bold text-white">{items.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Comestibles</p>
                <p className="text-2xl font-bold text-white">
                  {items.filter(i => i.tipo === 'comestible').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Otros Ítems</p>
                <p className="text-2xl font-bold text-white">
                  {items.filter(i => i.tipo === 'otros').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Upload className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Importados</p>
                <p className="text-2xl font-bold text-white">
                  {items.filter(i => i.metadata || i.original_id).length}
                </p>
              </div>
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
                  placeholder="Buscar ítems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Negocio
              </label>
              <select
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="all" className="bg-slate-800 text-gray-300">Todos los negocios</option>
                {businesses.map(business => (
                  <option key={business.id} value={business.id} className="bg-slate-800 text-white">
                    {business.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'comestible' | 'otros')}
                className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="all" className="bg-slate-800 text-gray-300">Todos los tipos</option>
                <option value="comestible" className="bg-slate-800 text-white">Comestible</option>
                <option value="otros" className="bg-slate-800 text-white">Otros</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setBusinessFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all border border-white/20"
              >
                <Filter className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ítem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Negocio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Propiedades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredItems.map((item) => {
                  const additionalProps = getAdditionalPropertiesCount(item);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {item.imagen ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover border border-white/20"
                                src={item.imagen}
                                alt={item.nombre}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 ${item.imagen ? 'hidden' : ''}`}>
                              <Image className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{item.nombre}</div>
                            {item.original_id && (
                              <div className="text-xs text-blue-400 font-mono">ID: {item.original_id}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {getBusinessName(item.negocio_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          item.tipo === 'comestible' 
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {item.weight && (
                            <span className="inline-flex px-2 py-1 text-xs bg-gray-500/20 text-gray-300 rounded">
                              {item.weight}g
                            </span>
                          )}
                          {item.stack && (
                            <span className="inline-flex px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                              Stack
                            </span>
                          )}
                          {item.degrade && item.degrade > 0 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                              {item.degrade}min
                            </span>
                          )}
                          {additionalProps > 0 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
                              +{additionalProps} props
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(item.fecha_creacion).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const code = itemImportService.generateItemCode(item);
                              copyToClipboard(code);
                            }}
                            className="text-green-400 hover:text-green-300 p-1 rounded transition-colors"
                            title="Copiar código"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No hay ítems</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm || businessFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No se encontraron ítems con los filtros aplicados.' 
                  : 'Comienza creando tu primer ítem.'}
              </p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl max-w-6xl w-full mx-4 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Editar Ítem' : 'Nuevo Ítem'}
                </h3>
                {isEditing && selectedItem?.metadata && (
                  <p className="text-sm text-gray-400 mt-1">
                    Este ítem tiene {getAdditionalPropertiesCount(selectedItem)} propiedades adicionales que se preservarán
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Formulario */}
                <div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nombre del Ítem
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="Ej: Hamburguesa Clásica"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Label (Mostrar en juego)
                        </label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="Ej: Hamburguesa Clásica"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Negocio
                        </label>
                        <select
                          required
                          value={formData.negocio_id}
                          onChange={(e) => setFormData({ ...formData, negocio_id: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          style={{
                            colorScheme: 'dark'
                          }}
                        >
                          <option value={0} className="bg-slate-800 text-gray-300">Seleccionar negocio</option>
                          {businesses.map(business => (
                            <option key={business.id} value={business.id} className="bg-slate-800 text-white">
                              {business.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tipo de Ítem
                        </label>
                        <select
                          value={formData.tipo}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'comestible' | 'otros' })}
                          className="w-full px-3 py-2 bg-slate-800 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          style={{
                            colorScheme: 'dark'
                          }}
                        >
                          <option value="comestible" className="bg-slate-800 text-white">Comestible</option>
                          <option value="otros" className="bg-slate-800 text-white">Otros</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Peso (gramos)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="115"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Degradación (minutos)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.degrade}
                          onChange={(e) => setFormData({ ...formData, degrade: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="30"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Tiempo en minutos para que el ítem se degrade (0 = sin degradación)
                        </p>
                      </div>
                    </div>

                    {formData.tipo === 'comestible' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Vencimiento (horas)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={formData.vencimiento_horas}
                          onChange={(e) => setFormData({ ...formData, vencimiento_horas: parseInt(e.target.value) || 24 })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                          placeholder="24"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Tiempo en horas antes de que el ítem venza (máximo 168 horas = 7 días)
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="stack"
                          checked={formData.stack}
                          onChange={(e) => setFormData({ ...formData, stack: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="stack" className="ml-2 block text-sm text-gray-300">
                          Apilable (Stack)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="close"
                          checked={formData.close}
                          onChange={(e) => setFormData({ ...formData, close: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="close" className="ml-2 block text-sm text-gray-300">
                          Cerrar al usar (Close)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="decay"
                          checked={formData.decay}
                          onChange={(e) => setFormData({ ...formData, decay: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="decay" className="ml-2 block text-sm text-gray-300">
                          Decaimiento (Decay)
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                        placeholder="Descripción del ítem para relacionarlo con el negocio..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        URL de Imagen
                      </label>
                      <input
                        type="url"
                        value={formData.imagen}
                        onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        URL de la imagen del ítem (opcional)
                      </p>
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
                        className="px-4 py-2 text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all shadow-lg"
                      >
                        {isEditing ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Vista previa del código en vivo */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Vista Previa del Código
                    </h4>
                    <button
                      onClick={() => copyToClipboard(liveCode)}
                      className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                      title="Copiar código"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                      {liveCode || '// El código aparecerá aquí mientras editas...'}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Este código se actualiza automáticamente mientras editas las propiedades del ítem.
                    {selectedItem?.metadata && (
                      <span className="block mt-1 text-blue-400">
                        ✨ Se preservan todas las propiedades adicionales del item original.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl max-w-4xl w-full mx-4 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Importar Ítems</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Pega aquí el código de items en formato Lua, JavaScript o JSON
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Items
                  </label>
                  <textarea
                    value={importContent}
                    onChange={(e) => setImportContent(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm font-mono text-sm"
                    placeholder={`return {
    ['bandage'] = {
        label = 'Bandage',
        weight = 115,
    },
    ['black_money'] = {
        label = 'Dirty Money',
        weight = 0,
        stack = true,
        close = true,
    },
    -- Más items...
}`}
                  />
                </div>

                {/* Errores */}
                {importErrors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-2">Errores:</h4>
                    <ul className="text-red-300 text-sm space-y-1">
                      {importErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advertencias */}
                {importWarnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="text-yellow-400 font-medium mb-2">Información:</h4>
                    <ul className="text-yellow-300 text-sm space-y-1">
                      {importWarnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Items importados */}
                {importedItems.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="text-green-400 font-medium mb-2">Items Listos para Importar ({importedItems.length}):</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <ul className="text-green-300 text-sm space-y-1">
                        {importedItems.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>• {item.id}: {item.nombre}</span>
                            <span className="text-gray-400">
                              {Object.keys(item).length} propiedades
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                      <p className="text-blue-300 text-sm">
                        ℹ️ Los items se asignarán automáticamente al primer negocio disponible. 
                        Podrás cambiar el negocio después editando cada item individualmente.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportContent('');
                      setImportedItems([]);
                      setImportErrors([]);
                      setImportWarnings([]);
                    }}
                    className="px-4 py-2 text-gray-300 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={processingImport}
                    className="px-4 py-2 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingImport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      'Procesar Importación'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl max-w-4xl w-full mx-4 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Exportar Ítems</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Código Lua listo para usar en GTA ({filteredItems.length} items)
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(exportCode)}
                    className="absolute top-2 right-2 z-10 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar
                  </button>
                  <pre className="bg-slate-800 text-gray-300 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono border border-white/20">
                    {exportCode}
                  </pre>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-gray-300 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Items;
