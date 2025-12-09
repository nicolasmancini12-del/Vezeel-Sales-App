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
import { Plus, Trash2, Edit2, Save, X, Lock, Download, AlertTriangle, Book, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  currentUser?: User | null;
}

const Settings: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'clients' | 'contractors' | 'prices' | 'users' | 'workflow' | 'units' | 'services' | 'backup'>('companies');

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {isReadOnly && activeTab !== 'backup' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <Lock size={16} />
                <span className="text-sm font-medium">Modo Solo Lectura: No tiene permisos para modificar la configuración.</span>
            </div>
        )}

        {activeTab === 'companies' && <CompaniesManager readOnly={isReadOnly} />}
        {activeTab === 'users' && <UsersManager readOnly={isReadOnly} />}
        {activeTab === 'clients' && <ClientsManager readOnly={isReadOnly} />}
        {activeTab === 'contractors' && <ContractorsManager readOnly={isReadOnly} />}
        {activeTab === 'prices' && <PriceListManager readOnly={isReadOnly} />}
        {activeTab === 'workflow' && <WorkflowManager readOnly={isReadOnly} />}
        {activeTab === 'units' && <UnitsManager readOnly={isReadOnly} />}
        {activeTab === 'services' && <ServiceCatalogManager readOnly={isReadOnly} />}
        {activeTab === 'backup' && <BackupManager />}
      </div>
    </div>
  );
};

// --- Sub-components ---

const BackupManager = () => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        const json = await exportBackup();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `nexus_cloud_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 mt-4">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Download className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Exportar Datos (Cloud)</h3>
                        <p className="text-sm text-gray-600">Descarga una copia completa de tu base de datos desde la nube.</p>
                    </div>
                </div>
                <button 
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                    {loading ? 'Generando Backup...' : 'Descargar Copia de Seguridad'}
                </button>
            </div>
        </div>
    );
};

// --- FULL IMPLEMENTATIONS ---

const UnitsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [editing, setEditing] = useState<Partial<UnitOfMeasure> | null>(null);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => { (async () => setUnits(await getUnits()))() }, []);
  
    const handleSave = async () => {
      if (!editing?.name) return;
      setLoading(true);
      const toSave = { 
          id: editing.id || Math.random().toString(36).substr(2, 9),
          name: editing.name
      } as UnitOfMeasure;
      setUnits(await saveUnit(toSave));
      setEditing(null);
      setLoading(false);
    };
    
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Unidades de Medida</h3>
          {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nueva</button>}
        </div>
        {loading && <Loader2 className="animate-spin text-blue-500 mb-2" />}
        {editing && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100 flex gap-2">
                <input className="border p-2 rounded flex-1" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre (ej: Horas)" />
                <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 rounded"><Save size={16}/></button>
                <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded"><X size={16}/></button>
            </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Nombre</th>{!readOnly && <th className="px-4 py-2"></th>}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {units.map(u => (
                    <tr key={u.id}>
                        <td className="px-4 py-3 text-sm">{u.name}</td>
                        {!readOnly && <td className="px-4 py-3 text-right">
                             <button onClick={() => setEditing(u)} className="text-blue-600 mr-2"><Edit2 size={16}/></button>
                             <button onClick={async () => { if(confirm('Borrar?')) setUnits(await deleteUnit(u.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                        </td>}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    );
};

const CompaniesManager = ({ readOnly }: { readOnly: boolean }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editing, setEditing] = useState<Partial<Company> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { (async () => setCompanies(await getCompanies()))() }, []);

    const handleSave = async () => {
        if (!editing?.name) return;
        setLoading(true);
        const toSave = { id: editing.id || Math.random().toString(36).substr(2, 9), name: editing.name } as Company;
        setCompanies(await saveCompany(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Empresas</h3>
                {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nueva</button>}
            </div>
            {editing && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-2">
                    <input className="border p-2 rounded flex-1" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre Empresa" />
                    <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 rounded"><Save size={16}/></button>
                    <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded"><X size={16}/></button>
                </div>
            )}
            <div className="space-y-2">
                {companies.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                        <span>{c.name}</span>
                        {!readOnly && <div className="flex gap-2">
                            <button onClick={() => setEditing(c)} className="text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={async () => { if(confirm('Borrar?')) setCompanies(await deleteCompany(c.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                        </div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const UsersManager = ({ readOnly }: { readOnly: boolean }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [editing, setEditing] = useState<Partial<User> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => { (async () => setUsers(await getUsers()))() }, []);

    const handleSave = async () => {
        if (!editing?.name || !editing.role) {
            setError("Nombre y Rol son obligatorios");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const nameParts = editing.name.split(' ');
            const initials = (nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : '')).toUpperCase();
            const toSave = { 
                id: editing.id || Math.random().toString(36).substr(2, 9),
                name: editing.name, 
                role: editing.role, 
                initials,
                accessCode: editing.accessCode || '1234'
            } as User;
            setUsers(await saveUser(toSave));
            setEditing(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error guardando usuario. Verifique permisos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Usuarios</h3>
                {!readOnly && <button onClick={() => { setEditing({}); setError(null); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nuevo</button>}
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm border border-red-200">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {editing && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-2 gap-2 border border-blue-100">
                    <input className="border p-2 rounded" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre" />
                    <select className="border p-2 rounded" value={editing.role || ''} onChange={e => setEditing({...editing, role: e.target.value})}>
                        <option value="">Rol...</option>
                        {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Código de Acceso (PIN)</label>
                        <input className="border p-2 rounded w-full" type="text" value={editing.accessCode || ''} onChange={e => setEditing({...editing, accessCode: e.target.value})} placeholder="Ej: 1234" />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                         <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                             {loading && <Loader2 className="animate-spin" size={14} />}
                             Guardar
                         </button>
                         <button onClick={() => { setEditing(null); setError(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                {users.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-xs">{u.initials}</div>
                            <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.role}</p>
                            </div>
                        </div>
                        {!readOnly && <div className="flex gap-2">
                            <button onClick={() => { setEditing(u); setError(null); }} className="text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={async () => { if(confirm('Borrar?')) setUsers(await deleteUser(u.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                        </div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClientsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [editing, setEditing] = useState<Partial<Client> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { (async () => setClients(await getClients()))() }, []);

    const handleSave = async () => {
        if (!editing?.name) return;
        setLoading(true);
        const toSave = { 
            id: editing.id || Math.random().toString(36).substr(2, 9), 
            name: editing.name,
            taxId: editing.taxId,
            contactName: editing.contactName
        } as Client;
        setClients(await saveClient(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Clientes</h3>
                {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nuevo</button>}
            </div>
            {editing && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-2 gap-2 border border-blue-100">
                    <input className="border p-2 rounded col-span-2" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Razón Social" />
                    <input className="border p-2 rounded" value={editing.taxId || ''} onChange={e => setEditing({...editing, taxId: e.target.value})} placeholder="RUT / ID Tributario" />
                    <input className="border p-2 rounded" value={editing.contactName || ''} onChange={e => setEditing({...editing, contactName: e.target.value})} placeholder="Nombre Contacto" />
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                         <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 rounded"><Save size={16}/></button>
                         <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded"><X size={16}/></button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Fiscal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        {!readOnly && <th className="px-4 py-2"></th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map(c => (
                        <tr key={c.id}>
                            <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{c.taxId}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{c.contactName}</td>
                            {!readOnly && <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditing(c)} className="text-blue-600"><Edit2 size={16}/></button>
                                    <button onClick={async () => { if(confirm('Borrar?')) setClients(await deleteClient(c.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                                </div>
                            </td>}
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
        </div>
    );
};

const ContractorsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editing, setEditing] = useState<Partial<Contractor> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { 
        (async () => {
            setContractors(await getContractors());
            setCompanies(await getCompanies());
        })(); 
    }, []);

    const handleSave = async () => {
        if (!editing?.name) return;
        setLoading(true);
        const toSave = { 
            id: editing.id || Math.random().toString(36).substr(2, 9), 
            name: editing.name,
            specialty: editing.specialty,
            company: editing.company
        } as Contractor;
        setContractors(await saveContractor(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Contratistas</h3>
                {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nuevo</button>}
            </div>
            {editing && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 border border-blue-100">
                    <input className="border p-2 rounded" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre" />
                    <input className="border p-2 rounded" value={editing.specialty || ''} onChange={e => setEditing({...editing, specialty: e.target.value})} placeholder="Especialidad (ej: SAP)" />
                    <select className="border p-2 rounded col-span-2 md:col-span-2" value={editing.company || ''} onChange={e => setEditing({...editing, company: e.target.value})}>
                        <option value="">Empresa Vinculada (Opcional)...</option>
                        {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                         <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 rounded"><Save size={16}/></button>
                         <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded"><X size={16}/></button>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                {contractors.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                        <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.specialty} {c.company && `• ${c.company}`}</p>
                        </div>
                        {!readOnly && <div className="flex gap-2">
                            <button onClick={() => setEditing(c)} className="text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={async () => { if(confirm('Borrar?')) setContractors(await deleteContractor(c.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                        </div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ServiceCatalogManager = ({ readOnly }: { readOnly: boolean }) => {
     const [services, setServices] = useState<ServiceCatalogItem[]>([]);
     const [editing, setEditing] = useState<Partial<ServiceCatalogItem> | null>(null);
     const [loading, setLoading] = useState(false);

    useEffect(() => { (async () => setServices(await getServices()))() }, []);

    const handleSave = async () => {
        if (!editing?.name) return;
        setLoading(true);
        const toSave = { 
            id: editing.id || Math.random().toString(36).substr(2, 9), 
            name: editing.name,
            category: editing.category
        } as ServiceCatalogItem;
        setServices(await saveService(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div>
             <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Catálogo de Servicios</h3>
                {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nuevo</button>}
            </div>
            {editing && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-2">
                    <input className="border p-2 rounded flex-1" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre Servicio" />
                    <input className="border p-2 rounded w-1/3" value={editing.category || ''} onChange={e => setEditing({...editing, category: e.target.value})} placeholder="Categoría" />
                    <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 rounded"><Save size={16}/></button>
                    <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded"><X size={16}/></button>
                </div>
            )}
             <div className="space-y-2">
                {services.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                         <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.category}</p>
                        </div>
                        {!readOnly && <div className="flex gap-2">
                            <button onClick={() => setEditing(s)} className="text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={async () => { if(confirm('Borrar?')) setServices(await deleteService(s.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                        </div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WorkflowManager = ({ readOnly }: { readOnly: boolean }) => {
    const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);
    const [editing, setEditing] = useState<Partial<WorkflowStatus> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { (async () => setWorkflow(await getWorkflow()))() }, []);

    const handleSave = async () => {
        if (!editing?.name) return;
        setLoading(true);
        const toSave = { 
            id: editing.id || Math.random().toString(36).substr(2, 9), 
            name: editing.name,
            color: editing.color || COLOR_OPTIONS[0].value,
            order: editing.order || (workflow.length + 1)
        } as WorkflowStatus;
        setWorkflow(await saveWorkflowStatus(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div>
             <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Flujo de Estados</h3>
                {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nuevo</button>}
            </div>
            {editing && (
                 <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 border border-blue-100">
                    <input className="border p-2 rounded" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nombre Estado" />
                    <input className="border p-2 rounded" type="number" value={editing.order || ''} onChange={e => setEditing({...editing, order: parseInt(e.target.value)})} placeholder="Orden (1, 2...)" />
                    <select className="border p-2 rounded col-span-2" value={editing.color || ''} onChange={e => setEditing({...editing, color: e.target.value})}>
                         <option value="">Seleccione Color...</option>
                         {COLOR_OPTIONS.map(c => <option key={c.label} value={c.value}>{c.label}</option>)}
                    </select>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                         <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 rounded"><Save size={16}/></button>
                         <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 rounded"><X size={16}/></button>
                    </div>
                 </div>
            )}
             <div className="space-y-2">
                {workflow.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{s.order}</span>
                            <span className={`px-2 py-0.5 rounded text-xs border ${s.color}`}>{s.name}</span>
                        </div>
                        {!readOnly && <div className="flex gap-2">
                            <button onClick={() => setEditing(s)} className="text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={async () => { if(confirm('Borrar?')) setWorkflow(await deleteWorkflowStatus(s.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                        </div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const PriceListManager = ({ readOnly }: { readOnly: boolean }) => {
    const [data, setData] = useState<PriceListEntry[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<ServiceCatalogItem[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [editing, setEditing] = useState<Partial<PriceListEntry> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { 
        (async () => {
            setData(await getPriceList());
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
        setData(await savePriceListEntry(toSave));
        setEditing(null);
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Precios y Costos</h3>
                {!readOnly && <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={16} /> Nuevo Precio</button>}
            </div>

            {editing && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-blue-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="col-span-1 md:col-span-3 pb-2 border-b border-gray-200 font-bold text-xs text-gray-500 uppercase">Definición</div>
                    
                    <select className="border p-2 rounded" value={editing.serviceName || ''} onChange={e => setEditing({...editing, serviceName: e.target.value})}>
                        <option value="">Seleccione Servicio...</option>
                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>

                    <select className="border p-2 rounded" value={editing.company || ''} onChange={e => setEditing({...editing, company: e.target.value})}>
                        <option value="">Empresa Vendedora...</option>
                        {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <select className="border p-2 rounded" value={editing.clientId || ''} onChange={e => setEditing({...editing, clientId: e.target.value})}>
                        <option value="">Cliente (Opcional - Específico)...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select className="border p-2 rounded" value={editing.contractorId || ''} onChange={e => setEditing({...editing, contractorId: e.target.value})}>
                        <option value="">Contratista (Opcional)...</option>
                        {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <div className="col-span-1 md:col-span-3 pb-2 border-b border-gray-200 font-bold text-xs text-gray-500 uppercase mt-2">Valores</div>

                    <select className="border p-2 rounded" value={editing.unitOfMeasure || ''} onChange={e => setEditing({...editing, unitOfMeasure: e.target.value})}>
                        {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    
                    <input className="border p-2 rounded" type="number" placeholder="Precio Venta" value={editing.unitPrice || ''} onChange={e => setEditing({...editing, unitPrice: parseFloat(e.target.value)})} />
                    <input className="border p-2 rounded" type="number" placeholder="Costo Contratista" value={editing.contractorCost || ''} onChange={e => setEditing({...editing, contractorCost: parseFloat(e.target.value)})} />

                    <div className="col-span-1 md:col-span-3 flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                         <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2 font-medium">{loading && <Loader2 className="animate-spin" size={16}/>} Guardar</button>
                         <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-6 py-2 rounded">Cancelar</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio / Empresa</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio / Costo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
                      {!readOnly && <th className="px-3 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map(item => {
                        const contractor = contractors.find(c => c.id === item.contractorId);
                        const client = clients.find(c => c.id === item.clientId);
                        const margin = item.unitPrice > 0 ? ((item.unitPrice - (item.contractorCost || 0)) / item.unitPrice) * 100 : 0;
                        const marginColor = margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600';
                        
                        return (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3">
                                    <div className="text-sm font-medium text-gray-900">{item.serviceName}</div>
                                    <div className="text-xs text-gray-500">{item.company}</div>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="text-xs text-gray-600"><span className="font-semibold">Cont:</span> {contractor ? contractor.name : 'Genérico'}</div>
                                    <div className="text-xs text-gray-600"><span className="font-semibold">Cli:</span> {client ? client.name : 'Todos'}</div>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="text-sm font-bold">${item.unitPrice} <span className="text-xs font-normal text-gray-500">/ {item.unitOfMeasure}</span></div>
                                    <div className="text-xs text-gray-500">Costo: ${item.contractorCost || 0}</div>
                                </td>
                                <td className="px-3 py-3">
                                    <span className={`text-sm font-bold ${marginColor}`}>{margin.toFixed(1)}%</span>
                                </td>
                                {!readOnly && <td className="px-3 py-3 text-right">
                                    <button onClick={async () => { if(confirm('Borrar?')) setData(await deletePriceListEntry(item.id)) }} className="text-red-600 p-1"><Trash2 size={16}/></button>
                                </td>}
                            </tr>
                        );
                    })}
                  </tbody>
                </table>
            </div>
        </div>
    );
};

export default Settings;