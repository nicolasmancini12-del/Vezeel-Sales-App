
import React, { useState, useMemo, useEffect } from 'react';
import { Order, Company, User, WorkflowStatus } from '../types';
import StatusBadge from './StatusBadge';
import { Edit2, Trash2, Search, Download } from 'lucide-react';
import { getCompanies, getWorkflow } from '../services/storageService';
import { ROLES } from '../constants';
import * as XLSX from 'xlsx';

interface Props {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  currentUser?: User | null;
}

const OrderList: React.FC<Props> = ({ orders, onEdit, onDelete, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);

  useEffect(() => {
      setCompanies(getCompanies());
      setWorkflow(getWorkflow());
  }, []);

  const canEdit = currentUser?.role !== ROLES.VIEWER;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.serviceDetails || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCompany = companyFilter === 'all' || order.company === companyFilter;
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesCompany && matchesStatus;
    });
  }, [orders, searchTerm, companyFilter, statusFilter]);

  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map(o => ({
      ID: o.id,
      FechaRegistro: o.date,
      EmpresaVendedora: o.company,
      Cliente: o.clientName,
      OC: o.poNumber,
      Servicio: o.serviceName,
      DetalleID_Servicio: o.serviceDetails || '',
      Cantidad: o.quantity,
      Unidad: o.unitOfMeasure,
      PrecioUnitario: o.unitPrice,
      CostoUnitario: o.unitCost || 0,
      TotalVenta: o.totalValue,
      Contratista: o.contractorName,
      Estado: o.status,
      Responsable: o.operationsRep,
      FechaCompromiso: o.commitmentDate,
      FechaCertificacion: o.clientCertDate,
      FechaFacturacion: o.billingDate,
      Observaciones: o.observations
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    
    // Auto-width columns
    const wscols = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 15 }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `NexusOrders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters Toolbar */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar por cliente, OC, servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 items-center">
          <div className="relative inline-block text-left min-w-[150px]">
             <select 
               value={companyFilter} 
               onChange={(e) => setCompanyFilter(e.target.value)}
               className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
             >
               <option value="all">Todas las Empresas</option>
               {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
             </select>
          </div>

          <div className="relative inline-block text-left min-w-[150px]">
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
             >
               <option value="all">Todos los Estados</option>
               {workflow.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
             </select>
          </div>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm ml-2"
            title="Descargar Excel"
          >
              <Download size={16} />
              <span className="hidden md:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info. General</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Servicio</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Económico</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gestión</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                        No se encontraron pedidos que coincidan con los filtros.
                    </td>
                </tr>
            ) : filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.id}</div>
                  <div className="text-sm text-gray-500">{order.date}</div>
                  <div className="text-xs text-gray-400 mt-1">{order.company.split(' ')[0]}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{order.clientName}</div>
                  <div className="text-sm text-gray-600 truncate max-w-xs" title={order.serviceName}>{order.serviceName}</div>
                  {order.serviceDetails && <div className="text-xs text-indigo-600 font-medium mt-0.5">{order.serviceDetails}</div>}
                  {order.poNumber && <div className="text-xs text-gray-500 mt-0.5">OC: {order.poNumber}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">${order.totalValue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{order.quantity} {order.unitOfMeasure} @ {order.unitPrice}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Resp: {order.operationsRep || 'N/A'}</div>
                  <div className="text-xs">Cont: {order.contractorName || 'Interno'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onEdit(order)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(order.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
