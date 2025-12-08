
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Plus, Layers, Settings as SettingsIcon, ChevronDown, User as UserIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import Settings from './components/Settings';
import { getOrders, saveOrder, deleteOrder, getUsers } from './services/storageService';
import { Order, User } from './types';
import { ROLES } from './constants';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // User State
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    setOrders(getOrders());
    const loadedUsers = getUsers();
    setUsers(loadedUsers);
    if (loadedUsers.length > 0) {
        setActiveUser(loadedUsers[0]);
    }
  }, []);

  // Reload users when entering settings
  useEffect(() => {
      if (currentView === 'settings') {
         const interval = setInterval(() => {
             const latest = getUsers();
             if (JSON.stringify(latest) !== JSON.stringify(users)) {
                 setUsers(latest);
             }
         }, 2000);
         return () => clearInterval(interval);
      }
  }, [currentView, users]);

  const canEdit = activeUser?.role !== ROLES.VIEWER;

  const handleCreateOrder = (order: Order) => {
    const updatedList = saveOrder(order);
    setOrders(updatedList);
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
      const updatedList = deleteOrder(id);
      setOrders(updatedList);
    }
  };

  const openNewOrder = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Layers className="text-white h-6 w-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight">NexusOrder</h1>
                <p className="text-xs text-slate-500">v1.2.0 (Prod)</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={20} />
            <span className="font-medium">Pedidos</span>
          </button>

          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <SettingsIcon size={20} />
            <span className="font-medium">Configuración</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 relative">
          <div 
            className="bg-slate-800 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs border-2 border-slate-600">
                        {activeUser?.initials || 'G'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate w-32">{activeUser?.name || 'Invitado'}</p>
                        <p className="text-xs text-slate-500 truncate w-32">{activeUser?.role || 'Lector'}</p>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* User Select Dropdown */}
          {isUserMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-xl py-1 overflow-hidden z-20 border border-gray-200">
                  <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Cambiar Usuario</p>
                  {users.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => { setActiveUser(u); setIsUserMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${activeUser?.id === u.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                      >
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                              {u.initials}
                          </div>
                          {u.name}
                      </button>
                  ))}
                  <button 
                    onClick={() => { setCurrentView('settings'); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center gap-2"
                  >
                      <Plus size={12} /> Gestionar Usuarios
                  </button>
              </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="text-blue-600 h-6 w-6" />
            <h1 className="text-lg font-bold text-gray-900">NexusOrder</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-md ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
              <LayoutDashboard size={24} />
            </button>
            <button onClick={() => setCurrentView('orders')} className={`p-2 rounded-md ${currentView === 'orders' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
              <List size={24} />
            </button>
            <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-md ${currentView === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
              <SettingsIcon size={24} />
            </button>
          </div>
        </div>

        {/* Header Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentView === 'dashboard' && 'Panel General'}
              {currentView === 'orders' && 'Gestión de Pedidos'}
              {currentView === 'settings' && 'Maestros y Configuración'}
            </h2>
            <p className="text-gray-500 mt-1">
              {currentView === 'dashboard' && 'Resumen financiero y operativo del grupo.'}
              {currentView === 'orders' && 'Administra órdenes de servicio y proyectos.'}
              {currentView === 'settings' && 'Gestión de clientes, contratistas y precios.'}
            </p>
          </div>
          {currentView === 'orders' && canEdit && (
            <button 
                onClick={openNewOrder}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all hover:shadow-lg transform hover:-translate-y-0.5"
            >
                <Plus size={20} />
                <span>Nuevo Pedido</span>
            </button>
          )}
        </div>

        {/* View Content */}
        <div className="animate-fade-in">
          {currentView === 'dashboard' && <Dashboard orders={orders} />}
          {currentView === 'orders' && (
            <OrderList 
              orders={orders} 
              onEdit={handleEditOrder}
              onDelete={handleDeleteOrder}
              currentUser={activeUser}
            />
          )}
          {currentView === 'settings' && <Settings currentUser={activeUser} />}
        </div>
      </main>

      {/* Modal */}
      <OrderForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrder}
        initialData={editingOrder}
      />

    </div>
  );
}

export default App;
