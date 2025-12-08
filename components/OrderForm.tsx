
import React, { useState, useEffect } from 'react';
import { Order, OrderFormData, Client, Contractor, PriceListEntry, Company, WorkflowStatus, UnitOfMeasure } from '../types';
import { X, Sparkles, Loader2, Calendar } from 'lucide-react';
import { analyzeTextForOrder } from '../services/geminiService';
import { getClients, getContractors, getPriceList, getCompanies, getWorkflow, getUnits } from '../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Order) => void;
  initialData?: Order | null;
}

const OrderForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  // Master data state
  const [clients, setClients] = useState<Client[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [priceList, setPriceList] = useState<PriceListEntry[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  
  // Available services based on selected company/contractor
  const [availableServices, setAvailableServices] = useState<PriceListEntry[]>([]);

  const [formData, setFormData] = useState<OrderFormData & { commitmentDate: string; clientCertDate: string; billingDate: string }>({
    date: new Date().toISOString().split('T')[0],
    company: '',
    clientId: '',
    poNumber: '',
    serviceName: '',
    unitOfMeasure: 'Horas',
    quantity: 1,
    unitPrice: 0,
    contractorId: '',
    status: '', // Set on load
    operationsRep: '',
    observations: '',
    commitmentDate: '',
    clientCertDate: '',
    billingDate: ''
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Load Master Data
  useEffect(() => {
    if (isOpen) {
        setClients(getClients());
        setContractors(getContractors());
        setPriceList(getPriceList());
        setWorkflow(getWorkflow());
        setUnits(getUnits());
        
        // Load companies and set default if form is empty
        const comps = getCompanies();
        setCompanies(comps);
        if (!initialData && comps.length > 0 && !formData.company) {
            setFormData(prev => ({ ...prev, company: comps[0].name }));
        }
    }
  }, [isOpen]);

  // Set default status and default unit if new
  useEffect(() => {
      if (!initialData && !formData.status && workflow.length > 0) {
          setFormData(prev => ({ 
              ...prev, 
              status: workflow[0].name,
              unitOfMeasure: units.length > 0 ? units[0].name : 'Horas' 
            }));
      }
  }, [workflow, initialData, formData.status, units]);

  // Filter Price List when Company or Contractor changes
  useEffect(() => {
    const filtered = priceList.filter(p => {
        // Filter by company name matching
        if (p.company !== formData.company) return false;
        // Filter by contractor (if specific price exists for that contractor)
        if (p.contractorId && formData.contractorId && p.contractorId !== formData.contractorId) return false;
        
        // Date Check
        const orderDate = formData.date;
        if (orderDate < p.validFrom || orderDate > p.validTo) return false;
        
        return true;
    });
    setAvailableServices(filtered);
  }, [formData.company, formData.contractorId, formData.date, priceList]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      const { id, totalValue, clientName, contractorName, ...rest } = initialData;
      setFormData({
          ...rest,
          commitmentDate: initialData.commitmentDate || '',
          clientCertDate: initialData.clientCertDate || '',
          billingDate: initialData.billingDate || ''
      });
    } else {
        // Reset to defaults but keep company if loaded
        setFormData(prev => ({
            date: new Date().toISOString().split('T')[0],
            company: prev.company,
            clientId: '',
            poNumber: '',
            serviceName: '',
            unitOfMeasure: units.length > 0 ? units[0].name : 'Horas',
            quantity: 1,
            unitPrice: 0,
            contractorId: '',
            status: workflow.length > 0 ? workflow[0].name : '',
            operationsRep: '',
            observations: '',
            commitmentDate: '',
            clientCertDate: '',
            billingDate: ''
        }));
    }
  }, [initialData, isOpen, workflow, units]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
        const newData = {
            ...prev,
            [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value
        };
        return newData;
    });
  };

  // Logic to auto-select price if service name matches a catalog entry
  const handleServiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      let update = { serviceName: val } as Partial<typeof formData>;

      // Try to find price match
      const match = availableServices.find(s => s.serviceName === val);
      if (match) {
          update.unitPrice = match.unitPrice;
          update.unitOfMeasure = match.unitOfMeasure;
          // Optionally auto-select contractor if locked in price list
          if(match.contractorId) update.contractorId = match.contractorId;
      }
      
      setFormData(prev => ({ ...prev, ...update }));
  }

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setIsThinking(true);
    
    const result = await analyzeTextForOrder(aiPrompt);
    
    if (result) {
        // Try to fuzzy match client name to ID
        let foundClientId = formData.clientId;
        if (result.client) {
            const clientMatch = clients.find(c => c.name.toLowerCase().includes(result.client.toLowerCase()));
            if (clientMatch) foundClientId = clientMatch.id;
        }

        setFormData(prev => ({
            ...prev,
            clientId: foundClientId,
            serviceName: result.serviceName || prev.serviceName,
            unitOfMeasure: result.unitOfMeasure || prev.unitOfMeasure,
            quantity: result.quantity ? parseFloat(result.quantity) : prev.quantity,
            observations: result.observations || prev.observations,
            poNumber: result.poNumber || prev.poNumber
        }));
    }
    
    setIsThinking(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalValue = formData.quantity * formData.unitPrice;
    
    const clientObj = clients.find(c => c.id === formData.clientId);
    const contractorObj = contractors.find(c => c.id === formData.contractorId);

    const orderToSave: Order = {
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      clientName: clientObj ? clientObj.name : 'Cliente Desconocido',
      contractorName: contractorObj ? contractorObj.name : 'No Asignado',
      totalValue
    };
    
    onSubmit(orderToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* AI Assist Section */}
          {!initialData && (
              <div className="mb-8 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold">
                      <Sparkles size={18} />
                      <span>AI Smart Assist</span>
                  </div>
                  <p className="text-xs text-indigo-600 mb-3">
                      Pega un correo o descripción rápida y autocompletaremos el formulario.
                  </p>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe el pedido aquí..."
                        className="flex-1 text-sm border-indigo-200 focus:ring-indigo-500 rounded-md"
                      />
                      <button 
                        type="button"
                        onClick={handleAiAssist}
                        disabled={isThinking || !aiPrompt}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                      >
                          {isThinking ? <Loader2 className="animate-spin" size={16} /> : 'Analizar'}
                      </button>
                  </div>
              </div>
          )}

          <form id="orderForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Section 1: Basic Info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Información General</h3>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Registro</label>
              <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Vendedora</label>
              <select name="company" required value={formData.company} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable Ops.</label>
              <input type="text" name="operationsRep" value={formData.operationsRep} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

            {/* Section 2: Client & Service */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Detalle del Servicio</h3>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select name="clientId" required value={formData.clientId} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Seleccione Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contratista</label>
              <select name="contractorId" value={formData.contractorId} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Interno / Sin Asignar</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
              </select>
            </div>

             <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">OC / PO Number</label>
              <input type="text" name="poNumber" value={formData.poNumber} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: OC-12345" />
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicio (Sugerido por lista de precios)</label>
              <input 
                list="services-list" 
                name="serviceName" 
                required 
                value={formData.serviceName} 
                onChange={handleServiceSelect} 
                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Escribe o selecciona un servicio..." 
              />
              <datalist id="services-list">
                  {availableServices.map(s => (
                      <option key={s.id} value={s.serviceName}>{`$${s.unitPrice} / ${s.unitOfMeasure} (${getContractors().find(c => c.id === s.contractorId)?.name || 'Genérico'})`}</option>
                  ))}
              </datalist>
            </div>

            {/* Section 3: Economics */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Económico</h3>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Medida</label>
                <select name="unitOfMeasure" required value={formData.unitOfMeasure} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" step="0.01" name="quantity" required value={formData.quantity} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                     Precio Unitario
                 </label>
                 <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input type="number" step="0.01" name="unitPrice" required value={formData.unitPrice} onChange={handleChange} className="w-full pl-7 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                 </div>
            </div>

            {/* Section 4: Fechas Hito & Estado */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Estado y Fechas Hito</h3>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado Actual</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                {workflow.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha Compromiso Cliente</label>
              <input type="date" name="commitmentDate" value={formData.commitmentDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha Certificación Cliente</label>
              <input type="date" name="clientCertDate" value={formData.clientCertDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

             <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha Facturación</label>
              <input type="date" name="billingDate" value={formData.billingDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observations" rows={2} value={formData.observations} onChange={handleChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            
            {/* Computed Total Display */}
            <div className="col-span-1 md:col-span-3 bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200 mt-4">
                <span className="text-gray-600 font-medium">Valor Total Estimado:</span>
                <span className="text-xl font-bold text-gray-900">
                    ${(formData.quantity * formData.unitPrice).toLocaleString()}
                </span>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Cancelar
          </button>
          <button type="submit" form="orderForm" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm">
            {initialData ? 'Guardar Cambios' : 'Crear Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;