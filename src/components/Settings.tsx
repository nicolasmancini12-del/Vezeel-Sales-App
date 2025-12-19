
import React, { useState, useEffect } from 'react';
import { Client, Contractor, PriceListEntry, Company, User, WorkflowStatus, UnitOfMeasure, ServiceCatalogItem } from '../types';
import { 
    getClients, saveClient, deleteClient, 
    getContractors, saveContractor, deleteContractor, 
    getPriceList, savePriceListEntry, deletePriceListEntry,
    getCompanies, saveCompany, deleteCompany,
    getUsers, saveUser, deleteUser,
    getWorkflow, saveWorkflowStatus, deleteWorkflowStatus,
    getUnits, saveUnit, deleteUnit,
    getServices, saveService, deleteService,
    exportBackup
} from '../services/storageService';
import { COLOR_OPTIONS, ROLES } from '../constants';
// FIX: Alias Settings icon to avoid conflict with Settings component name
import { Plus, Trash2, Edit2, Save, X, Lock, Download, Loader2, AlertCircle, Check, Shield, Settings as SettingsIcon } from 'lucide-react';

interface Props {
  currentUser?: User | null;
}

const Settings: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'workflow' | 'users' | 'units' | 'services' | 'clients' | 'contractors' | 'prices' | 'backup'>('companies');

  const isReadOnly = currentUser?.role === ROLES.VIEWER;

  const tabs = [
      { id: 'companies', label: 'Empresas' },
      { id: 'workflow', label: 'Flujo / Estados' },
      { id: 'users', label: 'Usuarios' },
      { id: 'units', label: 'Unidades' },
      { id: 'services', label: 'Catálogo Servicios' },
      { id: 'clients', label: 'Clientes' },
      { id: 'contractors', label: 'Contratistas' },
      { id: 'prices', label: 'Precios y Costos' },
      { id: 'backup', label: 'Respaldo' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
      <div className="border-b border-gray-200 bg-gray-50/50">
        <nav className="flex -mb-px overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 text-center border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
          ))}
        </nav>
      </div>

      <div className="p-6 flex-1 bg-white">
        {isReadOnly && activeTab !== 'backup' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <Lock size={16} />
                <span className="text-sm font-medium">Modo Consulta: No tiene permisos de edición en maestros.</span>
            </div>
        )}

        {activeTab === 'companies' && <CompaniesManager readOnly={isReadOnly} />}
        {activeTab === 'workflow' && <WorkflowManager readOnly={isReadOnly} />}
        {activeTab === 'users' && <UsersManager readOnly={isReadOnly} />}
        {activeTab === 'units' && <UnitsManager readOnly={isReadOnly} />}
        {activeTab === 'services' && <ServiceCatalogManager readOnly={isReadOnly} />}
        {activeTab === 'clients' && <ClientsManager readOnly={isReadOnly} />}
        {activeTab === 'contractors' && <ContractorsManager readOnly={isReadOnly} />}
        {activeTab === 'prices' && <PriceListManager readOnly={isReadOnly} />}
        {activeTab === 'backup' && <BackupManager />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES DE GESTIÓN ---

const CompaniesManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<Company[]>([]);
    const [editing, setEditing] = useState<Partial<Company> | null>(null);
    useEffect(() => { (async () => setList(await getCompanies()))() }, []);
    const handleSave = async () => {
        if (!editing?.name) return;
        setList(await saveCompany({ id: editing.id || Math.random().toString(36).substr(2, 9), name: editing.name }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Empresas Vendedoras</h3>{!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Plus size={16} /> Nueva Empresa</button>}</div>
            {editing && (<div className="bg-blue-50 p-4 rounded-xl mb-6 flex gap-3 border border-blue-100 shadow-inner"><input className="border-gray-300 p-2.5 rounded-lg flex-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre de la Empresa" autoFocus /><button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg transition-colors"><Save size={18}/></button><button onClick={() => setEditing(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 rounded-lg transition-colors"><X size={18}/></button></div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{list.map(item => (<div key={item.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"><div><p className="font-bold text-gray-800">{item.name}</p><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">ID: {item.id}</p></div>{!readOnly && <div className="flex gap-1"><button onClick={() => setEditing(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('¿Eliminar empresa?')) setList(await deleteCompany(item.id)) }} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></div>}</div>))}</div>
        </div>
    );
};

const WorkflowManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<WorkflowStatus[]>([]);
    const [editing, setEditing] = useState<Partial<WorkflowStatus> | null>(null);
    useEffect(() => { (async () => setList(await getWorkflow()))() }, []);
    const handleSave = async () => {
        if (!editing?.name) return;
        setList(await saveWorkflowStatus({ 
            id: editing.id || Math.random().toString(36).substr(2, 9), 
            name: editing.name, 
            order: editing.order || list.length + 1,
            color: editing.color || COLOR_OPTIONS[0].value 
        }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Flujo de Estados</h3>{!readOnly && <button onClick={() => setEditing({ order: list.length + 1 })} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Nuevo Estado</button>}</div>
            {editing && (<div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3"><input className="border p-2 rounded-lg text-sm" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre del Estado" /><input type="number" className="border p-2 rounded-lg text-sm" value={editing.order || ''} onChange={e => setEditing({...editing, order: parseInt(e.target.value)})} placeholder="Orden" /><select className="border p-2 rounded-lg text-sm" value={editing.color || ''} onChange={e => setEditing({...editing, color: e.target.value})}>{COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select><div className="md:col-span-3 flex justify-end gap-2"><button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Guardar</button><button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-6 py-2 rounded-lg font-bold text-sm">Cancelar</button></div></div>)}
            <div className="space-y-2">{list.map(item => (<div key={item.id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm"><div className="flex items-center gap-4"><span className="bg-gray-100 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{item.order}</span><span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.color}`}>{item.name}</span></div>{!readOnly && <div className="flex gap-2"><button onClick={() => setEditing(item)} className="text-blue-600"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('¿Eliminar estado?')) setList(await deleteWorkflowStatus(item.id)) }} className="text-red-600"><Trash2 size={16}/></button></div>}</div>))}</div>
        </div>
    );
};

const UsersManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<User[]>([]);
    const [editing, setEditing] = useState<Partial<User> | null>(null);
    useEffect(() => { (async () => setList(await getUsers()))() }, []);
    const handleSave = async () => {
        if (!editing?.name || !editing.role) return;
        const initials = (editing.name.split(' ').map(n => n[0]).join('')).toUpperCase().slice(0, 2);
        setList(await saveUser({ 
            id: editing.id || Math.random().toString(36).substr(2, 9), 
            name: editing.name, 
            role: editing.role, 
            initials, 
            accessCode: editing.accessCode || '1234' 
        }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Gestión de Usuarios</h3>{!readOnly && <button onClick={() => setEditing({ role: 'Lector' })} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Nuevo Usuario</button>}</div>
            {editing && (<div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Nombre Completo</label><input className="w-full border p-2.5 rounded-lg text-sm" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Ej: Juan Perez" /></div><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Rol de Usuario</label><select className="w-full border p-2.5 rounded-lg text-sm" value={editing.role || ''} onChange={e => setEditing({...editing, role: e.target.value})}>{Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Código de Acceso (PIN)</label><input className="w-full border p-2.5 rounded-lg text-sm font-mono" value={editing.accessCode || ''} onChange={e => setEditing({...editing, accessCode: e.target.value})} placeholder="Ej: 1234" /></div><div className="col-span-2 flex justify-end gap-2 pt-2"><button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Guardar Usuario</button><button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-6 py-2 rounded-lg font-bold text-sm">Cancelar</button></div></div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(u => (<div key={u.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between group hover:border-blue-400 transition-colors"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{u.initials}</div><div><p className="font-bold text-sm text-gray-800">{u.name}</p><p className="text-xs text-gray-500 flex items-center gap-1"><Shield size={10}/> {u.role}</p></div></div>{!readOnly && <div className="flex opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditing(u)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('¿Eliminar usuario?')) setList(await deleteUser(u.id)) }} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></div>}</div>))}</div>
        </div>
    );
};

const UnitsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<UnitOfMeasure[]>([]);
    const [editing, setEditing] = useState<Partial<UnitOfMeasure> | null>(null);
    useEffect(() => { (async () => setList(await getUnits()))() }, []);
    const handleSave = async () => {
        if (!editing?.name) return;
        setList(await saveUnit({ id: editing.id || Math.random().toString(36).substr(2, 9), name: editing.name }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Unidades de Medida</h3>{!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"><Plus size={16} className="inline mr-1"/> Nueva Unidad</button>}</div>
            {editing && (<div className="bg-gray-50 p-4 rounded-xl mb-6 flex gap-3 border border-gray-200"><input className="border p-2.5 rounded-lg flex-1 text-sm" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre de la Unidad (ej: Horas, Mza, Días)" autoFocus /><button onClick={handleSave} className="bg-emerald-600 text-white px-4 rounded-lg"><Save size={18}/></button><button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded-lg"><X size={18}/></button></div>)}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">{list.map(item => (<div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded-xl hover:shadow-sm"> <span className="text-sm font-medium text-gray-700">{item.name}</span> {!readOnly && <button onClick={async () => { if(confirm('¿Eliminar unidad?')) setList(await deleteUnit(item.id)) }} className="text-gray-300 hover:text-red-600 transition-colors"><X size={14}/></button>}</div>))}</div>
        </div>
    );
};

const ServiceCatalogManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<ServiceCatalogItem[]>([]);
    const [editing, setEditing] = useState<Partial<ServiceCatalogItem> | null>(null);
    useEffect(() => { (async () => setList(await getServices()))() }, []);
    const handleSave = async () => {
        if (!editing?.name) return;
        setList(await saveService({ id: editing.id || Math.random().toString(36).substr(2, 9), name: editing.name, category: editing.category || 'General' }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Catálogo Maestro de Servicios</h3>{!readOnly && <button onClick={() => setEditing({ category: 'General' })} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Nuevo Servicio</button>}</div>
            {editing && (<div className="bg-gray-50 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200"><input className="border p-2.5 rounded-lg text-sm" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre del Servicio" /><input className="border p-2.5 rounded-lg text-sm" value={editing.category || ''} onChange={e => setEditing({...editing, category: e.target.value})} placeholder="Categoría" /><div className="md:col-span-2 flex justify-end gap-2"><button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Guardar</button><button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-6 py-2 rounded-lg font-bold text-sm">Cancelar</button></div></div>)}
            <div className="space-y-2">{list.map(item => (<div key={item.id} className="p-4 bg-white border rounded-xl flex justify-between items-center hover:border-blue-200 transition-colors"><div><p className="font-bold text-gray-800">{item.name}</p><p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{item.category}</p></div>{!readOnly && <div className="flex gap-1"><button onClick={() => setEditing(item)} className="text-blue-600 p-2"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('¿Eliminar del catálogo?')) setList(await deleteService(item.id)) }} className="text-red-600 p-2"><Trash2 size={16}/></button></div>}</div>))}</div>
        </div>
    );
};

const ClientsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<Client[]>([]);
    const [editing, setEditing] = useState<Partial<Client> | null>(null);
    useEffect(() => { (async () => setList(await getClients()))() }, []);
    const handleSave = async () => {
        if (!editing?.name) return;
        setList(await saveClient({ id: editing.id || Math.random().toString(36).substr(2, 9), name: editing.name, taxId: editing.taxId || '', contactName: editing.contactName || '' }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Base de Clientes</h3>{!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Nuevo Cliente</button>}</div>
            {editing && (<div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Razón Social</label><input className="w-full border p-2.5 rounded-lg text-sm" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre Legal del Cliente" /></div><div><label className="text-[10px] font-bold text-gray-500 uppercase">ID Fiscal / RUT</label><input className="w-full border p-2.5 rounded-lg text-sm" value={editing.taxId || ''} onChange={e => setEditing({...editing, taxId: e.target.value})} placeholder="Ej: 99.999.999-K" /></div><div><label className="text-[10px] font-bold text-gray-500 uppercase">Contacto Principal</label><input className="w-full border p-2.5 rounded-lg text-sm" value={editing.contactName || ''} onChange={e => setEditing({...editing, contactName: e.target.value})} placeholder="Nombre de contacto" /></div><div className="md:col-span-2 flex justify-end gap-2 pt-2"><button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm">Guardar Cliente</button><button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-6 py-2 rounded-lg font-bold text-sm">Cancelar</button></div></div>)}
            <div className="overflow-x-auto border border-gray-100 rounded-xl"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente / Razón Social</th><th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Identificación</th><th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Referente</th>{!readOnly && <th className="px-6 py-3 text-right">Acciones</th>}</tr></thead><tbody className="bg-white divide-y divide-gray-100">{list.map(item => (<tr key={item.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.name}</td><td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{item.taxId || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">{item.contactName || '-'}</td>{!readOnly && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex justify-end gap-1"><button onClick={() => setEditing(item)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('¿Eliminar cliente?')) setList(await deleteClient(item.id)) }} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></div></td>}</tr>))}</tbody></table></div>
        </div>
    );
};

const ContractorsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<Contractor[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editing, setEditing] = useState<Partial<Contractor> | null>(null);
    useEffect(() => { (async () => { setList(await getContractors()); setCompanies(await getCompanies()); })() }, []);
    const handleSave = async () => {
        if (!editing?.name) return;
        setList(await saveContractor({ id: editing.id || Math.random().toString(36).substr(2, 9), name: editing.name, specialty: editing.specialty || '', company: editing.company || '' }));
        setEditing(null);
    };
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Contratistas Externos</h3>{!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Nuevo Contratista</button>}</div>
            {editing && (<div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-gray-500 uppercase">Nombre / Razón Social</label><input className="w-full border p-2.5 rounded-lg text-sm" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre del Contratista" /></div><div><label className="text-[10px] font-bold text-gray-500 uppercase">Especialidad</label><input className="w-full border p-2.5 rounded-lg text-sm" value={editing.specialty || ''} onChange={e => setEditing({...editing, specialty: e.target.value})} placeholder="Ej: Redes, Desarrollo, Consultoría" /></div><div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Empresa Vinculada (Vendedor Predeterminado)</label><select className="w-full border p-2.5 rounded-lg text-sm" value={editing.company || ''} onChange={e => setEditing({...editing, company: e.target.value})}><option value="">Ninguna / Independiente</option>{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div className="md:col-span-2 flex justify-end gap-2 pt-2"><button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Guardar Contratista</button><button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-6 py-2 rounded-lg font-bold text-sm">Cancelar</button></div></div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(item => (<div key={item.id} className="p-4 bg-white border border-gray-200 rounded-xl group hover:border-blue-400 transition-all shadow-sm"><div className="flex justify-between items-start mb-2"><div><p className="font-bold text-gray-800 text-sm">{item.name}</p><p className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 inline-block px-1.5 py-0.5 rounded mt-1">{item.specialty || 'General'}</p></div>{!readOnly && <div className="flex opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditing(item)} className="text-blue-600 p-1"><Edit2 size={14}/></button><button onClick={async () => { if(confirm('¿Eliminar contratista?')) setList(await deleteContractor(item.id)) }} className="text-red-600 p-1"><Trash2 size={14}/></button></div>}</div>{item.company && <p className="text-[10px] text-gray-400 mt-2 border-t pt-2 italic">Vinculado a: {item.company}</p>}</div>))}</div>
        </div>
    );
};

const PriceListManager = ({ readOnly }: { readOnly: boolean }) => {
    const [list, setList] = useState<PriceListEntry[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<ServiceCatalogItem[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [editing, setEditing] = useState<Partial<PriceListEntry> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { 
        (async () => {
            setList(await getPriceList());
            setCompanies(await getCompanies());
            setContractors(await getContractors());
            setClients(await getClients());
            setServices(await getServices());
            setUnits(await getUnits());
        })(); 
    }, []);

    const handleSave = async () => {
        if (!editing?.serviceName || !editing.company) return;
        setLoading(true);
        const toSave: PriceListEntry = {
            id: editing.id || Math.random().toString(36).substr(2, 9),
            serviceName: editing.serviceName,
            company: editing.company,
            contractorId: editing.contractorId || '',
            clientId: editing.clientId || '',
            unitOfMeasure: editing.unitOfMeasure || 'Horas',
            unitPrice: parseFloat(editing.unitPrice as any) || 0,
            contractorCost: parseFloat(editing.contractorCost as any) || 0,
            validFrom: editing.validFrom || new Date().toISOString().split('T')[0],
            validTo: editing.validTo || '2099-12-31'
        };
        setList(await savePriceListEntry(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-gray-800">Precios y Costos Unitarios</h3>{!readOnly && <button onClick={() => setEditing({ unitOfMeasure: 'Horas', unitPrice: 0, contractorCost: 0 })} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Plus size={16} /> Definir Nuevo Precio</button>}</div>
            {editing && (<div className="bg-blue-50/50 p-6 rounded-xl mb-8 border border-blue-100 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-3 pb-2 border-b border-blue-200"><h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2"><SettingsIcon size={14}/> Configuración del Valor</h4></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Servicio del Catálogo</label><select className="w-full border p-2.5 rounded-lg text-sm bg-white" value={editing.serviceName || ''} onChange={e => setEditing({...editing, serviceName: e.target.value})}><option value="">Seleccione Servicio...</option>{services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Empresa Vendedora</label><select className="w-full border p-2.5 rounded-lg text-sm bg-white" value={editing.company || ''} onChange={e => setEditing({...editing, company: e.target.value})}><option value="">Seleccione Empresa...</option>{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Unidad de Medida</label><select className="w-full border p-2.5 rounded-lg text-sm bg-white" value={editing.unitOfMeasure || ''} onChange={e => setEditing({...editing, unitOfMeasure: e.target.value})}>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cliente Específico (Opcional)</label><select className="w-full border p-2.5 rounded-lg text-sm bg-white" value={editing.clientId || ''} onChange={e => setEditing({...editing, clientId: e.target.value})}><option value="">Tarifa General (Todos)</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Contratista Asociado (Opcional)</label><select className="w-full border p-2.5 rounded-lg text-sm bg-white" value={editing.contractorId || ''} onChange={e => setEditing({...editing, contractorId: e.target.value})}><option value="">Sin Asignar / Independiente</option>{contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Precio Venta ($)</label><input type="number" className="w-full border p-2.5 rounded-lg text-sm font-bold text-blue-600" value={editing.unitPrice || ''} onChange={e => setEditing({...editing, unitPrice: parseFloat(e.target.value)})} /></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Costo Contratista ($)</label><input type="number" className="w-full border p-2.5 rounded-lg text-sm font-bold text-red-600" value={editing.contractorCost || ''} onChange={e => setEditing({...editing, contractorCost: parseFloat(e.target.value)})} /></div>
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-blue-100"><button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all">{loading ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>} Guardar Tarifa</button><button onClick={() => setEditing(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-all">Cancelar</button></div>
            </div>)}
            <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Servicio / Especialidad</th><th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Empresa / Alcance</th><th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Económicos</th><th className="px-6 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rentabilidad</th>{!readOnly && <th className="px-6 py-4"></th>}</tr></thead><tbody className="bg-white divide-y divide-gray-100">{list.map(item => { const contractor = contractors.find(c => c.id === item.contractorId); const client = clients.find(c => c.id === item.clientId); const margin = item.unitPrice > 0 ? ((item.unitPrice - (item.contractorCost || 0)) / item.unitPrice) * 100 : 0; return (<tr key={item.id} className="hover:bg-gray-50 group"><td className="px-6 py-4"> <p className="font-bold text-gray-800 text-sm">{item.serviceName}</p> <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">ID: {item.id.slice(0,6)}</p></td><td className="px-6 py-4"> <p className="text-xs text-gray-700 font-medium">{item.company}</p> <p className="text-[10px] text-gray-400 mt-1"><span className="font-bold text-gray-500 uppercase tracking-tighter">Alcance:</span> {client ? client.name : 'Global (Todos)'}</p></td><td className="px-6 py-4 text-right"> <div className="text-sm font-black text-gray-900">${item.unitPrice.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">/ {item.unitOfMeasure}</span></div> <div className="text-[10px] text-red-500 font-bold mt-1">Costo: ${item.contractorCost?.toLocaleString() || '0'}</div></td><td className="px-6 py-4 text-center"> <span className={`text-xs font-black px-2 py-1 rounded-full ${margin > 30 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : margin > 15 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{margin.toFixed(1)}%</span></td>{!readOnly && <td className="px-6 py-4 text-right"> <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditing(item)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('¿Eliminar esta tarifa?')) setList(await deletePriceListEntry(item.id)) }} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></div></td>}</tr>);})}</tbody></table></div>
        </div>
    );
};

const BackupManager = () => {
    const handleDownload = async () => {
        const json = await exportBackup();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nexus_order_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };
    return (
        <div className="max-w-md mx-auto bg-blue-50 p-8 rounded-2xl border border-blue-100 text-center animate-fade-in shadow-inner mt-10">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200"><Download size={32} className="text-white"/></div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Exportar Datos de Nexus Order</h3>
            <p className="text-sm text-blue-700/70 mb-8 leading-relaxed">Descarga una copia completa de la base de datos operativa, incluyendo pedidos, clientes, contratistas y configuraciones de seguridad.</p>
            <button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl flex justify-center gap-3 items-center font-bold shadow-md transition-all active:scale-95"><Download size={20}/> Descargar Respaldo JSON</button>
            <p className="text-[10px] text-blue-400 mt-6 uppercase font-bold tracking-widest">Nexus Order v1.6 Core</p>
        </div>
    );
};

export default Settings;
