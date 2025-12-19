
import React, { useState, useEffect } from 'react';
import { Order, OrderFormData, Client, Contractor, PriceListEntry, Company, WorkflowStatus, UnitOfMeasure, User, OrderHistoryEntry, Attachment, ProgressLogEntry } from '../types';
import { X, Sparkles, Loader2, Link as LinkIcon, ExternalLink, Trash2, Plus, Activity, Briefcase, Settings, Paperclip as PaperclipIcon, Edit2, RotateCcw, Check, Calendar } from 'lucide-react';
import { analyzeTextForOrder } from '../services/geminiService';
import { getClients, getContractors, getPriceList, getWorkflow, getUnits, getCompanies } from '../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Order) => void;
  initialData?: Order | null;
  currentUser?: User | null;
}

const OrderForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'admin' | 'files'>('general');
  const [clients, setClients] = useState<Client[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [priceList, setPriceList] = useState<PriceListEntry[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  
  const [loadingData, setLoadingData] = useState(false);
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
  const [progressLogs, setProgressLogs] = useState<ProgressLogEntry[]>([]);
  
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newProgressQty, setNewProgressQty] = useState<string>('');
  const [newProgressDate, setNewProgressDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProgressNote, setNewProgressNote] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setLoadingData(true);
        setActiveTab('general');
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
            
            if (!initialData) {
                if (com.length > 0) setFormData(prev => ({ ...prev, company: com[0].name }));
                if (wf.length > 0) setFormData(prev => ({ ...prev, status: wf[0].name }));
            }
            setLoadingData(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = priceList.filter(p => {
        if (p.company !== formData.company) return false;
        if (p.clientId && p.clientId !== formData.clientId) return false;
        return true;
    });
    setAvailableServices(filtered);
  }, [formData.company, formData.clientId, priceList]);

  useEffect(() => {
    if (initialData) {
      const { id, totalValue, clientName, contractorName, history: initHistory, attachments: initAttachments, progressLogs: initProgress, ...rest } = initialData;
      setFormData({
          ...rest,
          unitCost: initialData.unitCost || 0,
          commitmentDate: initialData.commitmentDate || '',
          clientCertDate: initialData.clientCertDate || '',
          billingDate: initialData.billingDate || ''
      });
      setHistory(initHistory || []);
      setAttachments(initAttachments || []);
      setProgressLogs(initProgress || []);
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
        setProgressLogs([]);
    }
    setEditingLogId(null);
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
      const match = availableServices.find(s => s.serviceName === val);
      if (match) {
          update.unitPrice = match.unitPrice;
          update.unitCost = match.contractorCost || 0; 
          update.unitOfMeasure = match.unitOfMeasure;
          if(match.contractorId) update.contractorId = match.contractorId;
      }
      setFormData(prev => ({ ...prev, ...update }));
  };

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

  const handleAddProgress = () => {
      const qty = parseFloat(newProgressQty);
      if(!qty || qty <= 0) return;

      if (editingLogId) {
          const updatedLogs = progressLogs.map(log => {
              if (log.id === editingLogId) {
                  return { ...log, date: newProgressDate, quantity: qty, notes: newProgressNote };
              }
              return log;
          });
          setProgressLogs(updatedLogs);
          setEditingLogId(null);
      } else {
          const newLog: ProgressLogEntry = {
              id: Math.random().toString(36).substr(2, 9),
              date: newProgressDate,
              quantity: qty,
              notes: newProgressNote,
              user: currentUser?.name || 'Sistema'
          };
          setProgressLogs([newLog, ...progressLogs]);
      }
      
      setNewProgressQty('');
      setNewProgressNote('');
      setNewProgressDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditLog = (log: ProgressLogEntry) => {
      setEditingLogId(log.id);
      setNewProgressQty(log.quantity.toString());
      setNewProgressDate(log.date);
      setNewProgressNote(log.notes);
      setActiveTab('files');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const orderToSave: Order = {
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      clientName: clients.find(c => c.id === formData.clientId)?.name || 'Cliente',
      contractorName: contractors.find(c => c.id === formData.contractorId)?.name || 'Sin Asignar',
      totalValue: formData.quantity * formData.unitPrice,
      history: history,
      attachments: attachments,
      progressLogs: progressLogs
    };
    await onSubmit(orderToSave);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  const totalProduced = progressLogs.reduce((acc, log) => acc + log.quantity, 0);
  const progressPercent = formData.quantity > 0 ? Math.min((totalProduced / formData.quantity) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto text-gray-800">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl sticky top-0 z-10">
          <div>
              <h2 className="text-xl font-bold">{initialData ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
              <p className="text-xs text-gray-400 font-medium tracking-tight">Nexus Order v1.5</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="bg-white px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-1">
                <button onClick={() => setActiveTab('general')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-all border-t border-x ${activeTab === 'general' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><Briefcase size={16} className="inline mr-2"/>General</button>
                <button onClick={() => setActiveTab('admin')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-all border-t border-x ${activeTab === 'admin' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><Settings size={16} className="inline mr-2"/>Administración</button>
                <button onClick={() => setActiveTab('files')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-all border-t border-x ${activeTab === 'files' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><PaperclipIcon size={16} className="inline mr-2"/>Avance y Docs</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loadingData ? <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto w-8 h-8"/></div> : (
          <form id="orderForm" onSubmit={handleSubmit}>
            <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                {!initialData && (
                    <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col gap-2 shadow-sm">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm"><Sparkles size={16} /> <span>AI Smart Assist</span></div>
                        <div className="flex gap-2">
                            <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ej: Servicio Java para Banco Futuro por 100 horas..." className="flex-1 text-sm border-indigo-200 focus:ring-indigo-500 rounded-md py-2 px-3 bg-white" />
                            <button type="button" onClick={handleAiAssist} disabled={isThinking || !aiPrompt} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm">{isThinking ? <Loader2 className="animate-spin" size={16} /> : 'Analizar'}</button>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Pedido</label><input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-gray-50" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label><select name="status" value={formData.status} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm">{workflow.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">OC / PO</label><input type="text" name="poNumber" value={formData.poNumber} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" placeholder="Ej: OC-12345" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label><select name="clientId" required value={formData.clientId} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm">{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label><input list="services-list" name="serviceName" required value={formData.serviceName} onChange={handleServiceSelect} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" placeholder="Seleccione un servicio..." /><datalist id="services-list">{availableServices.map((s, idx) => (<option key={idx} value={s.serviceName}>{`$${s.unitPrice} / ${s.unitOfMeasure}`}</option>))}</datalist></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Total</label><input type="number" step="0.01" name="quantity" required value={formData.quantity} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label><input type="number" step="0.01" name="unitPrice" required value={formData.unitPrice} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" /></div>
                    <div className="col-span-1 md:col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label><textarea name="observations" rows={3} value={formData.observations} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 text-sm bg-white shadow-sm"></textarea></div>
                </div>
            </div>

            <div className={activeTab === 'admin' ? 'block' : 'hidden'}>
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 mb-6">
                    <h3 className="text-sm font-bold text-amber-800 mb-4 border-b border-amber-200 pb-2">Configuración de Pedido</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div><label className="block text-xs font-bold text-amber-700 uppercase mb-1">Empresa Vendedora</label><select name="company" required value={formData.company} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white">{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-amber-700 uppercase mb-1">Responsable Operaciones</label><input type="text" name="operationsRep" value={formData.operationsRep} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white" placeholder="Nombre PM" /></div>
                        <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-amber-700 uppercase mb-1">Contratista Asignado</label><select name="contractorId" value={formData.contractorId} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white"><option value="">Interno / Propio</option>{contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    </div>
                </div>
                <div className="p-5 rounded-xl border border-gray-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">F. Compromiso Entrega</label><input type="date" name="commitmentDate" value={formData.commitmentDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">F. Certificación Cliente</label><input type="date" name="clientCertDate" value={formData.clientCertDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">F. Facturación</label><input type="date" name="billingDate" value={formData.billingDate} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2 text-sm" /></div>
                </div>
            </div>

            <div className={activeTab === 'files' ? 'block' : 'hidden'}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Avance de Producción Real</h3>
                        <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">{totalProduced.toFixed(2)} / {formData.quantity.toFixed(2)} {formData.unitOfMeasure}</div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }}></div>
                    </div>

                    <div className={`p-4 rounded-lg mb-6 border transition-colors ${editingLogId ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase text-gray-500">{editingLogId ? 'Modificar Registro' : 'Añadir Avance'}</span>
                            {editingLogId && <button type="button" onClick={() => { setEditingLogId(null); setNewProgressQty(''); }} className="text-[10px] text-orange-600 font-bold flex items-center gap-1 hover:underline"><RotateCcw size={10}/> Cancelar</button>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
                            <div className="col-span-1"><label className="text-[10px] text-gray-500 mb-1 block">Fecha</label><input type="date" value={newProgressDate} onChange={e => setNewProgressDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-1.5 text-xs"/></div>
                            <div className="col-span-1"><label className="text-[10px] text-gray-500 mb-1 block">Cantidad</label><input type="number" value={newProgressQty} onChange={e => setNewProgressQty(e.target.value)} className="w-full border border-gray-300 rounded-md p-1.5 text-xs font-bold"/></div>
                            <div className="col-span-3"><label className="text-[10px] text-gray-500 mb-1 block">Nota de Seguimiento</label><input type="text" value={newProgressNote} onChange={e => setNewProgressNote(e.target.value)} className="w-full border border-gray-300 rounded-md p-1.5 text-xs" placeholder="¿Qué se completó?"/></div>
                            <div className="col-span-1"><button type="button" onClick={handleAddProgress} disabled={!newProgressQty} className={`w-full py-1.5 rounded-md text-white text-xs font-bold shadow-sm transition-colors ${editingLogId ? 'bg-orange-600' : 'bg-blue-600'}`}>{editingLogId ? 'Actualizar' : 'Añadir'}</button></div>
                        </div>
                    </div>
                    
                    {progressLogs.length > 0 && (
                        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Fecha</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Cantidad</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Nota</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs bg-white">
                                    {progressLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3 py-3 text-gray-600 font-medium">{log.date}</td>
                                            <td className="px-3 py-3 font-bold text-gray-900 text-right">{log.quantity.toLocaleString()}</td>
                                            <td className="px-3 py-3 text-gray-500 italic truncate max-w-[200px]">{log.notes || '-'}</td>
                                            <td className="px-3 py-3 text-right">
                                                <button type="button" onClick={() => handleEditLog(log)} className="text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
          </form>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl shadow-inner">
          <div className="text-xs text-gray-500 font-medium">Total Valorizado: <span className="text-gray-900 font-bold text-base ml-1">${(formData.quantity * formData.unitPrice).toLocaleString()}</span></div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Cancelar</button>
            <button type="submit" form="orderForm" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all">
                {isSubmitting && <Loader2 className="animate-spin" size={16} />} 
                {initialData ? 'Guardar Cambios' : 'Generar Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
