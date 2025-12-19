
import React, { useState, useEffect } from 'react';
import { Order, OrderFormData, Client, Contractor, PriceListEntry, Company, WorkflowStatus, UnitOfMeasure, User, OrderHistoryEntry, Attachment, ProgressLogEntry } from '../types';
import { X, Sparkles, Loader2, Link as LinkIcon, ExternalLink, Trash2, Plus, Activity, Briefcase, Settings, Paperclip as PaperclipIcon, Edit2, RotateCcw, Check, Calendar, Receipt, FileCheck } from 'lucide-react';
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

  const [formData, setFormData] = useState<OrderFormData & { commitmentDate: string; productionDate: string; clientCertDate: string; billingDate: string, unitCost?: number }>({
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
    productionDate: '',
    clientCertDate: '',
    billingDate: ''
  });

  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLogEntry[]>([]);
  
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newProgressQty, setNewProgressQty] = useState<string>('');
  const [newProgressDate, setNewProgressDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProgressCertDate, setNewProgressCertDate] = useState('');
  const [newProgressBillDate, setNewProgressBillDate] = useState('');
  const [newProgressNote, setNewProgressNote] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setLoadingData(true);
        setActiveTab('general');
        Promise.all([
            getClients(), getContractors(), getPriceList(), getWorkflow(), getUnits(), getCompanies()
        ]).then(([cl, co, pl, wf, un, com]) => {
            setClients(cl); setContractors(co); setPriceList(pl); setWorkflow(wf); setUnits(un); setCompanies(com);
            if (!initialData) {
                if (com.length > 0) setFormData(prev => ({ ...prev, company: com[0].name }));
                if (wf.length > 0) setFormData(prev => ({ ...prev, status: wf[0].name }));
            }
            setLoadingData(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = priceList.filter(p => (p.company === formData.company && (!p.clientId || p.clientId === formData.clientId)));
    setAvailableServices(filtered);
  }, [formData.company, formData.clientId, priceList]);

  useEffect(() => {
    if (initialData) {
      const { id, totalValue, clientName, contractorName, history: initHistory, attachments: initAttachments, progressLogs: initProgress, ...rest } = initialData;
      setFormData({
          ...rest,
          unitCost: initialData.unitCost || 0,
          commitmentDate: initialData.commitmentDate || '',
          productionDate: initialData.productionDate || '',
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
            productionDate: '',
            clientCertDate: '',
            billingDate: ''
        }));
        setHistory([]); setAttachments([]); setProgressLogs([]);
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
      const match = availableServices.find(s => s.serviceName === val);
      if (match) {
          setFormData(prev => ({ ...prev, serviceName: val, unitPrice: match.unitPrice, unitCost: match.contractorCost || 0, unitOfMeasure: match.unitOfMeasure, contractorId: match.contractorId || prev.contractorId }));
      } else {
          setFormData(prev => ({ ...prev, serviceName: val }));
      }
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setIsThinking(true);
    try {
        const result = await analyzeTextForOrder(aiPrompt);
        if (result) {
            let foundClientId = formData.clientId;
            if (result.client) {
                const clientMatch = clients.find(c => c.name.toLowerCase().includes(result.client.toLowerCase()));
                if (clientMatch) foundClientId = clientMatch.id;
            }
            setFormData(prev => ({ ...prev, clientId: foundClientId, serviceName: result.serviceName || prev.serviceName, unitOfMeasure: result.unitOfMeasure || prev.unitOfMeasure, quantity: result.quantity ? parseFloat(result.quantity) : prev.quantity, observations: result.observations || prev.observations, poNumber: result.poNumber || prev.poNumber }));
        }
    } finally {
        setIsThinking(false);
    }
  };

  const handleAddProgress = () => {
      const qty = parseFloat(newProgressQty);
      if(!qty || qty <= 0) return;
      if (editingLogId) {
          setProgressLogs(progressLogs.map(log => log.id === editingLogId ? { ...log, date: newProgressDate, quantity: qty, notes: newProgressNote, certificationDate: newProgressCertDate || undefined, billingDate: newProgressBillDate || undefined } : log));
          setEditingLogId(null);
      } else {
          const newLog: ProgressLogEntry = { id: Math.random().toString(36).substr(2, 9), date: newProgressDate, quantity: qty, certificationDate: newProgressCertDate || undefined, billingDate: newProgressBillDate || undefined, notes: newProgressNote, user: currentUser?.name || 'Sistema' };
          setProgressLogs([newLog, ...progressLogs]);
      }
      setNewProgressQty(''); setNewProgressNote(''); setNewProgressDate(new Date().toISOString().split('T')[0]); setNewProgressCertDate(''); setNewProgressBillDate('');
  };

  const handleEditLog = (log: ProgressLogEntry) => {
      setEditingLogId(log.id);
      setNewProgressQty(log.quantity.toString());
      setNewProgressDate(log.date);
      setNewProgressNote(log.notes);
      setNewProgressCertDate(log.certificationDate || '');
      setNewProgressBillDate(log.billingDate || '');
      setActiveTab('files');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
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
    } catch (err) {
        console.error("Error submitting form:", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const totalProduced = progressLogs.reduce((acc, log) => acc + log.quantity, 0);
  const progressPercent = formData.quantity > 0 ? Math.min((totalProduced / formData.quantity) * 100, 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto text-gray-800">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl sticky top-0 z-10">
          <div>
              <h2 className="text-xl font-bold">{initialData ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
              <p className="text-xs text-gray-400 font-medium tracking-tight">Nexus Order v1.6 Core</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="bg-white px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-1">
                <button type="button" onClick={() => setActiveTab('general')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-all border-t border-x ${activeTab === 'general' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><Briefcase size={16} className="inline mr-2"/>General</button>
                <button type="button" onClick={() => setActiveTab('admin')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-all border-t border-x ${activeTab === 'admin' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><Settings size={16} className="inline mr-2"/>Administración Hitos</button>
                <button type="button" onClick={() => setActiveTab('files')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-all border-t border-x ${activeTab === 'files' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}><PaperclipIcon size={16} className="inline mr-2"/>Producción y Docs</button>
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
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">F. Registro Sistema</label><input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-gray-50" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado Operativo</label><select name="status" value={formData.status} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm">{workflow.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">OC / PO Number</label><input type="text" name="poNumber" value={formData.poNumber} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" placeholder="Ej: OC-12345" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Cliente Solicitante</label><select name="clientId" required value={formData.clientId} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm"><option value="">Seleccione Cliente...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Servicio (Tarifa Maestro)</label><input list="services-list" name="serviceName" required value={formData.serviceName} onChange={handleServiceSelect} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" placeholder="Seleccione un servicio del catálogo..." /><datalist id="services-list">{availableServices.map((s, idx) => (<option key={idx} value={s.serviceName}>{`$${s.unitPrice} / ${s.unitOfMeasure}`}</option>))}</datalist></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Total</label><input type="number" step="0.01" name="quantity" required value={formData.quantity} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Unidad Medida</label><select name="unitOfMeasure" required value={formData.unitOfMeasure} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm">{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario ($)</label><input type="number" step="0.01" name="unitPrice" required value={formData.unitPrice} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 bg-white shadow-sm" /></div>
                    <div className="col-span-1 md:col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Observaciones / Alcance</label><textarea name="observations" rows={3} value={formData.observations} onChange={handleChange} className="w-full border-gray-300 rounded-lg p-2.5 text-sm bg-white shadow-sm"></textarea></div>
                </div>
            </div>

            <div className={activeTab === 'admin' ? 'block' : 'hidden'}>
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 mb-6 shadow-sm">
                    <h3 className="text-sm font-bold text-amber-800 mb-4 border-b border-amber-200 pb-2 flex items-center gap-2"><Calendar className="text-amber-600" size={18}/> Hitos del Proyecto (Cabecera)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div><label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">F. Compromiso Entrega</label><input type="date" name="commitmentDate" value={formData.commitmentDate} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">F. Producción Final</label><input type="date" name="productionDate" value={formData.productionDate} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">F. Certificación Cliente</label><input type="date" name="clientCertDate" value={formData.clientCertDate} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">F. Facturación Orden</label><input type="date" name="billingDate" value={formData.billingDate} onChange={handleChange} className="w-full border-amber-200 rounded-lg p-2.5 bg-white text-sm" /></div>
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Empresa Vendedora</label><select name="company" required value={formData.company} onChange={handleChange} className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm font-bold">{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Responsable Operaciones (PM)</label><input type="text" name="operationsRep" value={formData.operationsRep} onChange={handleChange} className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm" placeholder="Nombre Responsable" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contratista Asignado</label><select name="contractorId" value={formData.contractorId} onChange={handleChange} className="w-full border-gray-200 rounded-lg p-2.5 bg-white text-sm shadow-inner"><option value="">Interno / Propio</option>{contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
            </div>

            <div className={activeTab === 'files' ? 'block' : 'hidden'}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-purple-500"/> Avance y Producción Detallada</h3>
                        <div className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">{totalProduced.toFixed(2)} / {formData.quantity.toFixed(2)} {formData.unitOfMeasure}</div>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden border border-gray-200">
                        <div className={`h-full rounded-full transition-all duration-700 ${progressPercent >= 100 ? 'bg-green-500' : 'bg-purple-600'}`} style={{ width: `${progressPercent}%` }}></div>
                    </div>

                    <div className={`p-5 rounded-xl mb-6 border transition-all ${editingLogId ? 'bg-orange-50 border-orange-200 shadow-md' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black uppercase text-gray-500 tracking-widest">{editingLogId ? 'Modificar Avance Registrado' : 'Reportar Nuevo Avance de Producción'}</span>
                            {editingLogId && <button type="button" onClick={() => { setEditingLogId(null); setNewProgressQty(''); }} className="text-[10px] bg-white border border-orange-300 text-orange-600 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-orange-100"><RotateCcw size={10}/> Cancelar Edición</button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">F. Producción</label><input type="date" value={newProgressDate} onChange={e => setNewProgressDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-xs font-bold"/></div>
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cantidad</label><input type="number" step="0.01" value={newProgressQty} onChange={e => setNewProgressQty(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-xs font-black text-purple-700"/></div>
                            <div><label className="text-[10px] font-bold text-blue-500 uppercase mb-1 block">F. Certificación</label><input type="date" value={newProgressCertDate} onChange={e => setNewProgressCertDate(e.target.value)} className="w-full border-blue-200 rounded-lg p-2 text-xs bg-blue-50/30"/></div>
                            <div><label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">F. Facturación</label><input type="date" value={newProgressBillDate} onChange={e => setNewProgressBillDate(e.target.value)} className="w-full border-emerald-200 rounded-lg p-2 text-xs bg-emerald-50/30"/></div>
                            <div className="lg:col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">&nbsp;</label><button type="button" onClick={handleAddProgress} disabled={!newProgressQty} className={`w-full py-2 rounded-lg text-white text-xs font-bold shadow-md transition-all ${editingLogId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'}`}>{editingLogId ? 'Actualizar Registro' : 'Añadir Avance'}</button></div>
                            <div className="lg:col-span-5"><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nota Interna / Detalle de este avance</label><input type="text" value={newProgressNote} onChange={e => setNewProgressNote(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-xs" placeholder="¿Qué tareas específicas se completaron en esta fecha?"/></div>
                        </div>
                    </div>
                    
                    {progressLogs.length > 0 && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Producción</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Cantidad</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Certificado</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Facturado</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Nota</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs bg-white">
                                    {progressLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-3 text-gray-700 font-bold">{log.date}</td>
                                            <td className="px-4 py-3 font-black text-gray-900 text-right">{log.quantity.toLocaleString()} <span className="text-[9px] text-gray-400 font-normal">{formData.unitOfMeasure}</span></td>
                                            <td className="px-4 py-3 text-center">
                                                {log.certificationDate ? <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-100"><FileCheck size={10}/> {log.certificationDate}</span> : <span className="text-gray-300 italic">Pendiente</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {log.billingDate ? <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100"><Receipt size={10}/> {log.billingDate}</span> : <span className="text-gray-300 italic">Pendiente</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{log.notes || '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button type="button" onClick={() => handleEditLog(log)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={14} /></button>
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
          <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">Total Venta Estimado: <span className="text-gray-900 font-black text-xl ml-1 tracking-normal">${(formData.quantity * formData.unitPrice).toLocaleString()}</span></div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all shadow-sm">Descartar</button>
            <button type="submit" form="orderForm" disabled={isSubmitting} className="px-10 py-2.5 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70">
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} 
                {initialData ? 'Guardar Cambios' : 'Generar Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
