import React, { useState, useEffect } from 'react';
import { Order, OrderFormData, Client, Contractor, PriceListEntry, Company, WorkflowStatus, UnitOfMeasure, User, OrderHistoryEntry, Attachment } from '../types';
import { X, Sparkles, Loader2, Calendar, Clock, User as UserIcon, Paperclip, Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { analyzeTextForOrder } from '../services/geminiService';
import { getClients, getContractors, getPriceList, getCompanies, getWorkflow, getUnits } from '../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Order) => void;
  initialData?: Order | null;
  currentUser?: User | null;
}

const OrderForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, currentUser }) => {
  // Master data state
  const [clients, setClients] = useState<Client[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [priceList, setPriceList] = useState<PriceListEntry[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Available services based on selected company/contractor
  const [availableServices, setAvailableServices] = useState<PriceListEntry[]>([]);

  const [formData, setFormData] = useState<OrderFormData & { commitmentDate: string; clientCertDate: string; billingDate: string, unitCost?: number }>({
    date: new Date().toISOString().split('T')[0],
    company: '',
    clientId: '',
    poNumber: '',
    serviceName: '',
    serviceDetails: '',
    unitOfMeasure: 'Horas',
    quantity: 1,
    unitPrice: 0,
    unitCost: 0,
    contractorId: '',
    status: '', 
    operationsRep: '',
    observations: '',
    commitmentDate: '',
    clientCertDate: '',
    billingDate: ''
  });

  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Master Data Async
  useEffect(() => {
    if (isOpen) {
        setLoadingData(true);
        Promise.all([
            getClients(),
            getContractors(),
            getPriceList(),
            getWorkflow(),
            getUnits(),
            getCompanies()
        ]).then(([cl, co, pl, wf, un, com]) => {
            setClients(cl);
            setContractors(co);
            setPriceList(pl);
            setWorkflow(wf);
            setUnits(un);
            setCompanies(com);
            
            if (!initialData && com.length > 0 && !formData.company) {
                setFormData(prev => ({ ...prev, company: com[0].name }));
            }
            if (!initialData && !formData.status && wf.length > 0) {
                setFormData(prev => ({ ...prev, status: wf[0].name }));
            }
            setLoadingData(false);
        });
    }
  }, [isOpen]);

  // Filter Price List Logic - IMPROVED ROBUSTNESS
  useEffect(() => {
    const filtered = priceList.filter(p => {
        // 1. Company Match (Mandatory)
        if (p.company !== formData.company) return false;
        
        // 2. Client Match logic:
        const priceClientId = p.clientId || '';
        const formClientId = formData.clientId || '';
        
        // If price is specific to a client, it MUST match the selected client.
        if (priceClientId !== '' && priceClientId !== formClientId) return false;
        // If price is generic (priceClientId === ''), it passes.

        // 3. Contractor Match logic:
        const priceContractorId = p.contractorId || '';
        const formContractorId = formData.contractorId || '';

        // If the user HAS selected a contractor
        if (formContractorId !== '') {
            // Filter out prices that are for a DIFFERENT contractor
            // (Keep Generic Prices AND Prices for this Contractor)
            if (priceContractorId !== '' && priceContractorId !== formContractorId) return false;
        }

        return true;
    });
    setAvailableServices(filtered);
  }, [formData.company, formData.contractorId, formData.clientId, priceList]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      const { id, totalValue, clientName, contractorName, history: initHistory, attachments: initAttachments, ...rest } = initialData;
      setFormData({
          ...rest,
          unitCost: initialData.unitCost || 0,
          commitmentDate: initialData.commitmentDate || '',
          clientCertDate: initialData.clientCertDate || '',
          billingDate: initialData.billingDate || ''
      });
      setHistory(initHistory || []);
      setAttachments(initAttachments || []);
    } else {
        setFormData(prev => ({
            date: new Date().toISOString().split('T')[0],
            company: prev.company,
            clientId: '',
            poNumber: '',
            serviceName: '',
            serviceDetails: '',
            unitOfMeasure: units.length > 0 ? units[0].name : 'Horas',
            quantity: 1,
            unitPrice: 0,
            unitCost: 0,
            contractorId: '',
            status: workflow.length > 0 ? workflow[0].name : '',
            operationsRep: '',
            observations: '',
            commitmentDate: '',
            clientCertDate: '',
            billingDate: ''
        }));
        setHistory([]);
        setAttachments([]);
    }
    setNewAttachmentUrl('');
    setNewAttachmentName('');
  }, [initialData, isOpen, workflow, units]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value
    }));
  };

  const handleServiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      let update = { serviceName: val } as Partial<typeof formData>;
      // Find matching service in the filtered list
      const match = availableServices.find(s => s.serviceName === val);
      
      if (match) {
          update.unitPrice = match.unitPrice;
          update.unitCost = match.contractorCost || 0; 
          update.unitOfMeasure = match.unitOfMeasure;
          // Auto-select Contractor if the price list entry demands it
          if(match.contractorId) update.contractorId = match.contractorId;
      }
      setFormData(prev => ({ ...prev, ...update }));
  }

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setIsThinking(true);
    const result = await analyzeTextForOrder(aiPrompt);
    if (result) {
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

  const handleAddAttachment = () => {
      if(!newAttachmentName || !newAttachmentUrl) return;
      const newAtt: Attachment = {
          id: Math.random().toString(36).substr(2, 9),
          name: newAttachmentName,
          url: newAttachmentUrl.startsWith('http') ? newAttachmentUrl : `https://${newAttachmentUrl}`,
          date: new Date().toISOString().split('T')[0]
      };
      setAttachments([...attachments, newAtt]);
      setNewAttachmentName('');
      setNewAttachmentUrl('');
  };

  const removeAttachment = (id: string) => {
      setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const totalValue = formData.quantity * formData.unitPrice;
    
    const clientObj = clients.find(c => c.id === formData.clientId);
    const contractorObj = contractors.find(c => c.id === formData.contractorId);

    // AUDIT LOG LOGIC
    let updatedHistory = [...history];
    const currentUserInitials = currentUser?.name || 'Sistema';

    if (!initialData) {
        updatedHistory.push({
            date: new Date().toISOString(),
            user: currentUserInitials,
            action: 'Creado',
            details: 'Pedido registrado en el sistema'
        });
    } else {
        if (initialData.status !== formData.status) {
            updatedHistory.push({
                date: new Date().toISOString(),
                user: currentUserInitials,
                action: 'Cambio Estado',
                details: `Cambió de "${initialData.status}" a "${formData.status}"`
            });
        } else {
            updatedHistory.push({
                date: new Date().toISOString(),
                user: currentUserInitials,
                action: 'Editado',
                details: 'Actualización de datos del pedido'
            });
        }
    }

    const orderToSave: Order = {
      ...formData,
      unitCost: formData.unitCost || 0,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      clientName: clientObj ? clientObj.name : 'Cliente Desconocido',
      contractorName: contractorObj ? contractorObj.name : 'No Asignado',
      totalValue,
      history: updatedHistory,
      attachments: attachments
    };
    
    await onSubmit(orderToSave);
    setIsSubmitting(false);
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

        {loadingData ? (
             <div className="flex-1 flex items-center justify-center p-12">
                 <Loader2 className="animate-spin text-blue-600 w-8 h-8"/>
             </div>
        ) : (
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* AI Assist Section */}
          {!initialData && (
              <div className="mb-8 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold">
                      <Sparkles size={18} />
                      <span>AI Smart Assist</span>
                  </div>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ej: Servicio Java para Banco Futuro por 100 horas..."
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
              <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Vendedora</label>
              <select name="company" required value={formData.company} onChange={handleChange} className="w-full border-gray-300 rounded-lg">
                {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable Ops.</label>
              <input type="text" name="operationsRep" value={formData.operationsRep} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            {/* Section 2: Client & Service */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Detalle del Servicio</h3>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select name="clientId" required value={formData.clientId} onChange={handleChange} className="w-full border-gray-300 rounded-lg">
                  <option value="">Seleccione Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contratista</label>
              <select name="contractorId" value={formData.contractorId} onChange={handleChange} className="w-full border-gray-300 rounded-lg">
                  <option value="">Interno / Sin Asignar</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
              </select>
            </div>

             <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">OC / PO Number</label>
              <input type="text" name="poNumber" value={formData.poNumber} onChange={handleChange} className="w-full border-gray-300 rounded-lg" placeholder="Ej: OC-12345" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicio (Precios)</label>
              <input 
                list="services-list" 
                name="serviceName" 
                required 
                value={formData.serviceName} 
                onChange={handleServiceSelect} 
                className="w-full border-gray-300 rounded-lg" 
                placeholder="Seleccione un servicio para cargar precios..." 
              />
              <datalist id="services-list">
                  {availableServices.map((s, idx) => (
                      <option key={`${s.id}-${idx}`} value={s.serviceName}>{`$${s.unitPrice} / ${s.unitOfMeasure}`}</option>
                  ))}
              </datalist>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalle Adicional</label>
                <input 
                    type="text" 
                    name="serviceDetails" 
                    value={formData.serviceDetails || ''} 
                    onChange={handleChange} 
                    className="w-full border-gray-300 rounded-lg"
                    placeholder="Ej: Ticket #100" 
                />
            </div>

            {/* Section 3: Economics */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Económico</h3>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Medida</label>
                <select name="unitOfMeasure" required value={formData.unitOfMeasure} onChange={handleChange} className="w-full border-gray-300 rounded-lg">
                    {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" step="0.01" name="quantity" required value={formData.quantity} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
                 <input type="number" step="0.01" name="unitPrice" required value={formData.unitPrice} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            {/* Section 4: Fechas Hito & Estado */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Estado y Fechas</h3>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado Actual</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border-gray-300 rounded-lg">
                {workflow.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Compromiso</label>
              <input type="date" name="commitmentDate" value={formData.commitmentDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            {/* RESTORED CERTIFICATION DATE FIELD */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Certificación</label>
              <input type="date" name="clientCertDate" value={formData.clientCertDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Facturación</label>
              <input type="date" name="billingDate" value={formData.billingDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observations" rows={2} value={formData.observations} onChange={handleChange} className="w-full border-gray-300 rounded-lg"></textarea>
            </div>

             {/* Section 5: Documentos y Enlaces */}
             <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Documentos y Enlaces</h3>
            </div>
            
            <div className="col-span-1 md:col-span-3">
                <div className="flex flex-col md:flex-row gap-2 mb-3">
                    <input 
                        type="text" 
                        placeholder="Nombre (ej: Orden de Compra PDF)" 
                        value={newAttachmentName}
                        onChange={(e) => setNewAttachmentName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    />
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon size={14} className="text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Pegar URL (Drive, SharePoint, etc.)" 
                                value={newAttachmentUrl}
                                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 pl-9 text-sm"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddAttachment}
                            disabled={!newAttachmentName || !newAttachmentUrl}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                {attachments.length > 0 ? (
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {attachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                                        <Paperclip size={14} />
                                    </div>
                                    <div>
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                            {att.name} <ExternalLink size={10} />
                                        </a>
                                        <p className="text-[10px] text-gray-400">{att.date}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeAttachment(att.id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No hay documentos adjuntos.</p>
                )}
            </div>
            
            {/* AUDIT LOG SECTION */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-gray-100 mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Historial de Cambios</h3>
            </div>
            <div className="col-span-1 md:col-span-3 bg-gray-50 p-3 rounded text-xs text-gray-500 max-h-40 overflow-y-auto border border-gray-200">
                {history.length > 0 ? (
                    <div className="space-y-2">
                        {history.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <div className="min-w-[80px] font-medium text-gray-700">{new Date(h.date).toLocaleDateString()}</div>
                                <div className="flex-1">
                                    <span className="font-bold text-gray-800">{h.user}</span>: <span className="text-gray-600">{h.action}</span>
                                    <p className="text-gray-500 mt-0.5">{h.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center italic py-2">Sin historial registrado.</p>
                )}
            </div>

          </form>
        </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" form="orderForm" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            {initialData ? 'Guardar Cambios' : 'Crear Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;