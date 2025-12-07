
import React, { useState, useEffect } from 'react';
import { Client, Contractor, PriceListEntry, Company, User, WorkflowStatus } from '../types';
import { 
    getClients, saveClient, deleteClient, 
    getContractors, saveContractor, deleteContractor, 
    getPriceList, savePriceListEntry, deletePriceListEntry,
    getCompanies, saveCompany, deleteCompany,
    getUsers, saveUser, deleteUser,
    getWorkflow, saveWorkflowStatus, deleteWorkflowStatus
} from '../services/storageService';
import { UNITS_OF_MEASURE, COLOR_OPTIONS, ROLES } from '../constants';
import { Plus, Trash2, Edit2, Save, X, Lock } from 'lucide-react';

interface Props {
  currentUser?: User | null;
}

const Settings: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'clients' | 'contractors' | 'prices' | 'users' | 'workflow'>('companies');

  const isReadOnly = currentUser?.role === ROLES.VIEWER;

  const tabs = [
      { id: 'companies', label: 'Empresas' },
      { id: 'workflow', label: 'Flujo / Estados' },
      { id: 'users', label: 'Usuarios' },
      { id: 'clients', label: 'Clientes' },
      { id: 'contractors', label: 'Contratistas' },
      { id: 'prices', label: 'Precios' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto">
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
        {isReadOnly && (
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
      </div>
    </div>
  );
};

// --- Sub-components ---

const WorkflowManager = ({ readOnly }: { readOnly: boolean }) => {
    const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);
    const [editing, setEditing] = useState<Partial<WorkflowStatus> | null>(null);

    useEffect(() => setWorkflow(getWorkflow()), []);

    const handleSave = () => {
        if (!editing?.name) return;
        const toSave = { 
            id: editing.id || Math.random().toString(36).substr(2, 9),
            name: editing.name,
            order: Number(editing.order) || (workflow.length + 1),
            color: editing.color || COLOR_OPTIONS[0].value
        } as WorkflowStatus;
        
        setWorkflow(saveWorkflowStatus(toSave));
        setEditing(null);
    };

    return (
        <div>
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Editor de Estados (Workflow)</h3>
              <p className="text-sm text-gray-500">Defina los pasos del ciclo de vida de los pedidos.</p>
            </div>
            {!readOnly && (
                <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 h-fit">
                    <Plus size={16} /> Nuevo Estado
                </button>
            )}
          </div>
          
          {editing && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                      <label className="text-xs text-gray-500 font-bold block mb-1">Orden (1, 2, 3...)</label>
                      <input 
                        type="number"
                        className="border p-2 rounded w-full text-sm"
                        value={editing.order || ''} 
                        onChange={e => setEditing({...editing, order: parseInt(e.target.value)})} 
                      />
                  </div>
                  <div className="md:col-span-1">
                      <label className="text-xs text-gray-500 font-bold block mb-1">Nombre Estado</label>
                      <input 
                        className="border p-2 rounded w-full text-sm"
                        value={editing.name || ''} 
                        onChange={e => setEditing({...editing, name: e.target.value})} 
                      />
                  </div>
                  <div className="md:col-span-1">
                      <label className="text-xs text-gray-500 font-bold block mb-1">Color Etiqueta</label>
                      <select 
                        className="border p-2 rounded w-full text-sm"
                        value={editing.color || ''}
                        onChange={e => setEditing({...editing, color: e.target.value})}
                      >
                          {COLOR_OPTIONS.map((c, i) => (
                              <option key={i} value={c.value}>{c.label}</option>
                          ))}
                      </select>
                  </div>
                  <div className="flex gap-2 justify-end md:col-span-1">
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><Save size={16}/> Guardar</button>
                    <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><X size={16}/></button>
                  </div>
              </div>
          )}
    
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vista Previa</th>
                      {!readOnly && <th className="px-4 py-2 text-right">Acciones</th>}
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {workflow.map(w => (
                      <tr key={w.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{w.order}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{w.name}</td>
                          <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${w.color}`}>
                                  {w.name}
                              </span>
                          </td>
                          {!readOnly && (
                              <td className="px-4 py-3 text-right">
                                  <button onClick={() => setEditing(w)} className="text-blue-600 hover:text-blue-900 mr-2 p-1"><Edit2 size={16}/></button>
                                  <button onClick={() => setWorkflow(deleteWorkflowStatus(w.id))} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16}/></button>
                              </td>
                          )}
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
  
    useEffect(() => setCompanies(getCompanies()), []);
  
    const handleSave = () => {
      if (!editing?.name) return;
      const toSave = { 
          id: editing.id || Math.random().toString(36).substr(2, 9),
          name: editing.name
      } as Company;
      
      setCompanies(saveCompany(toSave));
      setEditing(null);
    };
  
    return (
      <div>
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Empresas del Grupo</h3>
          </div>
          {!readOnly && (
              <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 h-fit">
                  <Plus size={16} /> Nueva Empresa
              </button>
          )}
        </div>
        
        {editing && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100 grid grid-cols-2 gap-4">
                <input 
                  placeholder="Razón Social Empresa" 
                  className="border p-2 rounded w-full"
                  value={editing.name || ''} 
                  onChange={e => setEditing({...editing, name: e.target.value})} 
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><Save size={16}/> Guardar</button>
                  <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><X size={16}/> Cancelar</button>
                </div>
            </div>
        )}
  
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Razón Social</th>
                    {!readOnly && <th className="px-4 py-2 text-right">Acciones</th>}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {companies.map(c => (
                    <tr key={c.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{c.name}</td>
                        {!readOnly && (
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => setEditing(c)} className="text-blue-600 hover:text-blue-900 mr-2 p-1"><Edit2 size={16}/></button>
                                <button onClick={() => setCompanies(deleteCompany(c.id))} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16}/></button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    );
};

const UsersManager = ({ readOnly }: { readOnly: boolean }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [editing, setEditing] = useState<Partial<User> | null>(null);
  
    useEffect(() => setUsers(getUsers()), []);
  
    const handleSave = () => {
      if (!editing?.name || !editing?.role) return;
      const nameParts = editing.name.split(' ');
      const initials = (nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : '')).toUpperCase();

      const toSave = { 
          id: editing.id || Math.random().toString(36).substr(2, 9),
          name: editing.name,
          role: editing.role,
          initials
      } as User;
      
      setUsers(saveUser(toSave));
      setEditing(null);
    };
  
    return (
      <div>
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Usuarios del Sistema</h3>
          </div>
          {!readOnly && (
              <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 h-fit">
                  <Plus size={16} /> Nuevo Usuario
              </button>
          )}
        </div>
        
        {editing && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  placeholder="Nombre Completo" 
                  className="border p-2 rounded w-full text-sm"
                  value={editing.name || ''} 
                  onChange={e => setEditing({...editing, name: e.target.value})} 
                />
                <select 
                  className="border p-2 rounded w-full text-sm"
                  value={editing.role || ''} 
                  onChange={e => setEditing({...editing, role: e.target.value})} 
                >
                    <option value="">Seleccionar Rol</option>
                    {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-2 items-center">
                  <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><Save size={16}/> Guardar</button>
                  <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><X size={16}/> Cancelar</button>
                </div>
            </div>
        )}
  
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Iniciales</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    {!readOnly && <th className="px-4 py-2 text-right">Acciones</th>}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                    <tr key={u.id}>
                        <td className="px-4 py-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {u.initials}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{u.role}</td>
                        {!readOnly && (
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => setEditing(u)} className="text-blue-600 hover:text-blue-900 mr-2 p-1"><Edit2 size={16}/></button>
                                <button onClick={() => setUsers(deleteUser(u.id))} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16}/></button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    );
};

const ClientsManager = ({ readOnly }: { readOnly: boolean }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);

  useEffect(() => setClients(getClients()), []);

  const handleSave = () => {
    if (!editing?.name) return;
    const toSave = { 
        id: editing.id || Math.random().toString(36).substr(2, 9),
        name: editing.name,
        taxId: editing.taxId,
        contactName: editing.contactName
    } as Client;
    
    setClients(saveClient(toSave));
    setEditing(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Directorio de Clientes</h3>
        {!readOnly && (
            <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                <Plus size={16} /> Nuevo Cliente
            </button>
        )}
      </div>
      
      {editing && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                placeholder="Nombre Cliente" 
                className="border p-2 rounded"
                value={editing.name || ''} 
                onChange={e => setEditing({...editing, name: e.target.value})} 
              />
              <input 
                placeholder="RUT / Tax ID" 
                className="border p-2 rounded"
                value={editing.taxId || ''} 
                onChange={e => setEditing({...editing, taxId: e.target.value})} 
              />
              <div className="flex gap-2">
                 <input 
                    placeholder="Contacto" 
                    className="border p-2 rounded flex-1"
                    value={editing.contactName || ''} 
                    onChange={e => setEditing({...editing, contactName: e.target.value})} 
                />
                <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded"><Save size={16}/></button>
                <button onClick={() => setEditing(null)} className="bg-gray-400 text-white p-2 rounded"><X size={16}/></button>
              </div>
          </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
              <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Fiscal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  {!readOnly && <th className="px-4 py-2"></th>}
              </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
              {clients.map(c => (
                  <tr key={c.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.taxId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.contactName || '-'}</td>
                      {!readOnly && (
                          <td className="px-4 py-3 text-right">
                              <button onClick={() => setEditing(c)} className="text-blue-600 hover:text-blue-900 mr-2"><Edit2 size={14}/></button>
                              <button onClick={() => setClients(deleteClient(c.id))} className="text-red-600 hover:text-red-900"><Trash2 size={14}/></button>
                          </td>
                      )}
                  </tr>
              ))}
          </tbody>
      </table>
    </div>
  );
};

const ContractorsManager = ({ readOnly }: { readOnly: boolean }) => {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editing, setEditing] = useState<Partial<Contractor> | null>(null);
  
    useEffect(() => {
        setContractors(getContractors());
        setCompanies(getCompanies());
    }, []);
  
    const handleSave = () => {
      if (!editing?.name) return;
      const toSave = { 
          id: editing.id || Math.random().toString(36).substr(2, 9),
          name: editing.name,
          specialty: editing.specialty,
          company: editing.company
      } as Contractor;
      
      setContractors(saveContractor(toSave));
      setEditing(null);
    };
  
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Contratistas y Proveedores</h3>
          {!readOnly && (
              <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                  <Plus size={16} /> Nuevo Contratista
              </button>
          )}
        </div>
        
        {editing && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nombre / Razón Social</label>
                    <input 
                    className="border p-2 rounded w-full text-sm"
                    value={editing.name || ''} 
                    onChange={e => setEditing({...editing, name: e.target.value})} 
                    />
                </div>
                <div>
                     <label className="text-xs text-gray-500 mb-1 block">Empresa Vendedora (Asignada)</label>
                     <select 
                        className="border p-2 rounded w-full text-sm"
                        value={editing.company || ''} 
                        onChange={e => setEditing({...editing, company: e.target.value})}
                     >
                         <option value="">-- Multiempresa / Global --</option>
                         {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                </div>
                <div className="flex gap-2 items-end">
                   <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Especialidad</label>
                      <input 
                          className="border p-2 rounded w-full text-sm"
                          value={editing.specialty || ''} 
                          onChange={e => setEditing({...editing, specialty: e.target.value})} 
                      />
                   </div>
                  <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded mb-0.5"><Save size={16}/></button>
                  <button onClick={() => setEditing(null)} className="bg-gray-400 text-white p-2 rounded mb-0.5"><X size={16}/></button>
                </div>
            </div>
        )}
  
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empresa Vendedora</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                    {!readOnly && <th className="px-4 py-2"></th>}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {contractors.map(c => (
                    <tr key={c.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                            {c.company ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {c.company}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">Global</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{c.specialty || '-'}</td>
                        {!readOnly && (
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => setEditing(c)} className="text-blue-600 hover:text-blue-900 mr-2"><Edit2 size={14}/></button>
                                <button onClick={() => setContractors(deleteContractor(c.id))} className="text-red-600 hover:text-red-900"><Trash2 size={14}/></button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    );
  };

  const PriceListManager = ({ readOnly }: { readOnly: boolean }) => {
    const [prices, setPrices] = useState<PriceListEntry[]>([]);
    const [editing, setEditing] = useState<Partial<PriceListEntry> | null>(null);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        setPrices(getPriceList());
        setContractors(getContractors());
        setCompanies(getCompanies());
    }, []);
  
    const handleSave = () => {
      if (!editing?.serviceName || !editing?.unitPrice || !editing.company) return;
      const toSave = { 
          id: editing.id || Math.random().toString(36).substr(2, 9),
          serviceName: editing.serviceName,
          company: editing.company,
          contractorId: editing.contractorId,
          unitOfMeasure: editing.unitOfMeasure || 'Horas',
          unitPrice: Number(editing.unitPrice),
          validFrom: editing.validFrom || new Date().toISOString().split('T')[0],
          validTo: editing.validTo || '2099-12-31'
      } as PriceListEntry;
      
      setPrices(savePriceListEntry(toSave));
      setEditing(null);
    };

    const getContractorName = (id?: string) => {
        if(!id) return 'Cualquiera';
        return contractors.find(c => c.id === id)?.name || 'Desconocido';
    }
  
    return (
      <div>
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Catálogo de Servicios y Precios</h3>
          </div>
          {!readOnly && (
              <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 h-fit">
                  <Plus size={16} /> Agregar Precio
              </button>
          )}
        </div>

        {/* Edit Form */}
        {editing && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-xs text-gray-500 font-bold">Empresa Vendedora *</label>
                        <select 
                            className="border p-2 rounded w-full text-sm bg-white"
                            value={editing.company} 
                            onChange={e => setEditing({...editing, company: e.target.value})}
                        >
                            <option value="">Seleccionar Empresa</option>
                            {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold">Contratista Asociado</label>
                        <select 
                            className="border p-2 rounded w-full text-sm bg-white"
                            value={editing.contractorId} 
                            onChange={e => setEditing({...editing, contractorId: e.target.value})}
                        >
                            <option value="">Todos / Genérico</option>
                            {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold">Nombre Servicio *</label>
                        <input 
                            className="border p-2 rounded w-full text-sm"
                            value={editing.serviceName || ''} 
                            onChange={e => setEditing({...editing, serviceName: e.target.value})} 
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-500">Unidad Medida</label>
                        <select 
                            className="border p-2 rounded w-full text-sm bg-white"
                            value={editing.unitOfMeasure} 
                            onChange={e => setEditing({...editing, unitOfMeasure: e.target.value})}
                        >
                             {UNITS_OF_MEASURE.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Precio Unitario</label>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-gray-400">$</span>
                            <input 
                                type="number"
                                className="border p-2 pl-6 rounded w-full text-sm"
                                value={editing.unitPrice || ''} 
                                onChange={e => setEditing({...editing, unitPrice: Number(e.target.value)})} 
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <div className="w-1/2">
                            <label className="text-xs text-gray-500">Valido Desde</label>
                            <input type="date" className="border p-2 rounded w-full text-sm" value={editing.validFrom || ''} onChange={e => setEditing({...editing, validFrom: e.target.value})} />
                         </div>
                         <div className="w-1/2">
                            <label className="text-xs text-gray-500">Hasta</label>
                            <input type="date" className="border p-2 rounded w-full text-sm" value={editing.validTo || ''} onChange={e => setEditing({...editing, validTo: e.target.value})} />
                         </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(null)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm">Cancelar</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><Save size={16}/> Guardar</button>
                </div>
            </div>
        )}
  
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empresa Vendedora</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contratista</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                        {!readOnly && <th className="px-4 py-2"></th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {prices.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                             <td className="px-4 py-3 text-sm text-gray-900 font-medium">{p.company}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {getContractorName(p.contractorId)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{p.serviceName}</td>
                           
                            <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                                ${p.unitPrice} <span className="text-gray-500 text-xs font-normal">/ {p.unitOfMeasure}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                                {p.validFrom} <span className="mx-1">➔</span> {p.validTo}
                            </td>
                            {!readOnly && (
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setEditing(p)} className="text-blue-600 hover:text-blue-900 mr-2"><Edit2 size={14}/></button>
                                    <button onClick={() => setPrices(deletePriceListEntry(p.id))} className="text-red-600 hover:text-red-900"><Trash2 size={14}/></button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  };

export default Settings;
