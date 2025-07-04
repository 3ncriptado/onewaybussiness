import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, User, TrendingUp } from 'lucide-react';
import { Sale, Statistics } from '../types';
import { salesService, statisticsService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Layout from './Layout';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, dateFilter]);

  const loadData = async () => {
    try {
      const [salesData, statsData] = await Promise.all([
        salesService.getAll(),
        statisticsService.get()
      ]);
      setSales(salesData);
      setStatistics(statsData);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las ventas'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.fecha_venta);
        return saleDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredSales(filtered);
  };

  const exportData = (format: 'json' | 'csv') => {
    const dataToExport = filteredSales.map(sale => ({
      id: sale.id,
      negocio: sale.negocio_nombre,
      comprador: sale.comprador_nombre,
      monto: sale.monto,
      fecha: sale.fecha_venta
    }));

    if (format === 'json') {
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ventas_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      const csvHeaders = 'ID,Negocio,Comprador,Monto,Fecha\n';
      const csvData = dataToExport.map(row => 
        `${row.id},"${row.negocio}","${row.comprador}",${row.monto},"${row.fecha}"`
      ).join('\n');
      
      const csvContent = csvHeaders + csvData;
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
      
      const exportFileDefaultName = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }

    addToast({
      type: 'success',
      title: 'Exportación exitosa',
      message: `Datos exportados en formato ${format.toUpperCase()}`
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout currentPage="ventas">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="ventas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Historial de Ventas</h1>
          <div className="flex gap-2">
            <button
              onClick={() => exportData('json')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Ventas</p>
                <p className="text-2xl font-bold text-white">{sales.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Ingresos Totales</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.monto, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Promedio por Venta</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.monto, 0) / sales.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filtrar por fecha
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setDateFilter('')}
                className="w-full bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-lg transition-all border border-white/20"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-400">
                Mostrando {filteredSales.length} de {sales.length} ventas
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Negocio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Comprador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID Comprador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha de Venta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      #{sale.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {sale.negocio_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        {sale.comprador_nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {sale.comprador_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                      {formatCurrency(sale.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(sale.fecha_venta).toLocaleString('es-DO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No hay ventas</h3>
              <p className="mt-1 text-sm text-gray-400">
                {dateFilter ? 'No se encontraron ventas para la fecha seleccionada.' : 'Aún no se han registrado ventas.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Sales;