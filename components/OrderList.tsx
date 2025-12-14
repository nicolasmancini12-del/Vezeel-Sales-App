
import React, { useState, useMemo, useEffect } from 'react';
import { Order, Company, User, WorkflowStatus } from '../types';
import StatusBadge from './StatusBadge';
import { Edit2, Trash2, Search, Download, Paperclip, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, CalendarClock } from 'lucide-react';
import { getCompanies, getWorkflow } from '../services/storageService';
import { ROLES } from '../constants';
import * as XLSX from 'xlsx';

interface Props {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  currentUser?: User | null;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

const OrderList: React.FC<Props> = ({ orders, onEdit, onDelete, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

  useEffect(() => {
      // Async load for filters
      (async () => {
          setCompanies(await getCompanies());
          setWorkflow(await getWorkflow());
      })();
  }, []);

  const canEdit = currentUser?.role !== ROLES.VIEWER;

  // Sorting Handler
  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: string) => {
    if (sortConfig.key !== name) return <ArrowUpDown size={14} className="text-gray-300 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-blue-600 ml-1" /> 
      : <ArrowDown size={14} className="text-blue-600 ml-1" />;
  };

  const filteredAndSortedOrders = useMemo(() => {
    // 1. Filter
    let result = orders.filter(order => {
      const matchesSearch = 
        (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.serviceDetails || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.contractorName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCompany = companyFilter === 'all' || order.company === companyFilter;
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesCompany && matchesStatus;
    });

    // 2. Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        // Custom Sort Logic for Calculated Fields
        if (sortConfig.key === 'progress') {
            const aProg = (a.progressLogs?.reduce((acc: number, l: any) => acc + l.quantity, 0) || 0) / (a.quantity || 1);
            const bProg = (b.progressLogs?.reduce((acc: number, l: any) => acc + l.quantity, 0) || 0) / (b.quantity || 1);
            aValue = aProg;
            bValue = bProg;
        } else {
            // Default Direct Access
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        // Handle nulls/undefined
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        // String comparison
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [orders, searchTerm, companyFilter, statusFilter, sortConfig]);

  const handleExportExcel = () => {
    // Sheet 1: Orders (General)
    const ordersData = filteredAndSortedOrders.map(o => {
        const progress = o.progressLogs?.reduce((acc, l) => acc + l.quantity, 0) || 0;
        
        return {
            ID: o.id,
            FechaRegistro: o.date,
            EmpresaVendedora: o.company,
            Cliente: o.clientName,
            OC: o.poNumber,
            Servicio: o.serviceName,
            DetalleID_Servicio: o.serviceDetails || '',
            CantidadTotal: o.quantity,
            Unidad: o.unitOfMeasure,
            Avance_Acumulado: progress,
            Avance_Porcentaje: o.quantity > 0 ? (progress / o.quantity).toFixed(2) : 0,
            PrecioUnitario: o.unitPrice,
            CostoUnitario: o.unitCost || 0,
            TotalVenta: o.totalValue,
            Contratista: o.contractorName,
            Estado: o.status,
            Responsable: o.operationsRep,
            FechaCompromiso: o.commitmentDate,
            FechaCertificacion: o.clientCertDate,
            FechaFacturacion: o.billingDate,
            Observaciones: o.observations,
            Adjuntos: o.attachments?.map(a => a.name).join(', ') || ''
        };
    });

    // Sheet 2: Detailed Progress Logs
    const progressData: any[] = [];
    filteredAndSortedOrders.forEach(o => {
        if (o.progressLogs && o.progressLogs.length > 0) {
            o.progressLogs.forEach(log => {
                progressData.push({
                    PedidoID: o.id,
                    Cliente: o.clientName,
                    Servicio: o.serviceName,
                    Fecha_Avance: log.date,
                    Cantidad_Avance: log.quantity,
                    Unidad: o.unitOfMeasure,
                    Fecha_Certificacion_Parcial: log.certificationDate || 'Pendiente',
                    Fecha_Facturacion_Parcial: log.billingDate || 'Pendiente',
                    Usuario_Reporte: log.user,
                    Nota: log.notes
                });
            });
        }
    });

    const wb = XLSX.utils.book_new();
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Pedidos");
    const wscols = Object.keys(ordersData[0] || {}).map(() => ({ wch: 20 }));
    wsOrders['!cols'] = wscols;

    if (progressData.length > 0) {
        const wsProgress = XLSX.utils.json_to_sheet(progressData);
        XLSX.utils.book_append_sheet(wb, wsProgress, "Detalle_Avances");
        const wsProgCols = Object.keys(progressData[0] || {}).map(() => ({ wch: 20 }));
        wsProgress['!cols'] = wsProgCols;
    }

    XLSX.writeFile(wb, `NexusOrders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper for overdue check
  const isOverdue = (dateStr?: string, status?: string) => {
      if (!dateStr || status === 'Facturado' || status === 'Certificado') return false;
      return new Date(dateStr) < new Date();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Filters Toolbar */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar por cliente, OC, contratista..."
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
          >
              <Download size={16} />
              <span className="hidden md:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th 
                onClick={() => requestSort('date')}
                scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                <div className="flex items-center">Fecha / ID {getSortIcon('date')}</div>
              </th>
              
              <th 
                onClick={() => requestSort('clientName')}
                scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                <div className="flex items-center">Cliente / Servicio {getSortIcon('clientName')}</div>
              </th>

              <th 
                onClick={() => requestSort('contractorName')}
                scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                 <div className="flex items-center">Contratista {getSortIcon('contractorName')}</div>
              </th>
              
              <th 
                onClick={() => requestSort('progress')}
                scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                 <div className="flex items-center">Avance {getSortIcon('progress')}</div>
              </th>

              <th 
                onClick={() => requestSort('totalValue')}
                scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                <div className="flex items-center">Económico {getSortIcon('totalValue')}</div>
              </th>

              <th 
                onClick={() => requestSort('status')}
                scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                <div className="flex items-center">Estado {getSortIcon('status')}</div>
              </th>
              
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedOrders.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">
                        No se encontraron pedidos con los filtros actuales.
                    </td>
                </tr>
            ) : filteredAndSortedOrders.map((order) => {
              const progress = order.progressLogs?.reduce((acc, l) => acc + l.quantity, 0) || 0;
              const percent = order.quantity > 0 ? (progress / order.quantity) * 100 : 0;
              const overdue = isOverdue(order.commitmentDate, order.status);
              
              return (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                {/* 1. Fecha / ID */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">#{order.id.slice(0,8)}</div>
                      {order.attachments && order.attachments.length > 0 && (
                          <Paperclip size={14} className="text-blue-500" />
                      )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                      {order.date}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{order.company.split(' ')[0]}</div>
                  
                  {/* Alert visual improvement */}
                  {overdue && (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[10px] font-semibold">
                          <AlertTriangle size={10} /> Vencido
                      </div>
                  )}
                </td>

                {/* 2. Cliente / Servicio */}
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{order.clientName}</div>
                  <div className="text-sm text-gray-600 truncate max-w-[200px]" title={order.serviceName}>{order.serviceName}</div>
                  {order.poNumber && <div className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">OC: {order.poNumber}</div>}
                  {order.commitmentDate && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1" title="Fecha Compromiso">
                          <CalendarClock size={10} /> {order.commitmentDate}
                      </div>
                  )}
                </td>

                {/* 3. Contratista (New Column) */}
                <td className="px-6 py-4 whitespace-nowrap">
                    {order.contractorName ? (
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-700 font-medium">{order.contractorName}</span>
                            {order.operationsRep && <span className="text-[10px] text-gray-400">Resp: {order.operationsRep}</span>}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Interno</span>
                    )}
                </td>

                {/* 4. Avance (New Column) */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                            <span>{Math.round(percent)}%</span>
                            <span>{progress}/{order.quantity}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                style={{width: `${Math.min(percent, 100)}%`}}
                            ></div>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate">{order.unitOfMeasure}</span>
                    </div>
                </td>

                {/* 5. Económico (Cleaned) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">${order.totalValue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">${order.unitPrice} / u</div>
                </td>

                {/* 6. Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.status} />
                </td>

                {/* 7. Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(order)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(order.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
