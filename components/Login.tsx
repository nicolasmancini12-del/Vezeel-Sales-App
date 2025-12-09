import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers, initDatabase } from '../services/storageService';
import { LogIn, Loader2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);
  
  // Auth State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      if (data.length === 0) {
        // If no users, prompt initialization
        setInitializing(true);
        await initDatabase(); // Auto-seed if empty
        const seeded = await getUsers();
        setUsers(seeded);
      }
    } catch (err) {
      console.error(err);
      setError('Error conectando a la base de datos. Verifique su conexión.');
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const handleUserSelect = (user: User) => {
      setSelectedUser(user);
      setPasswordInput('');
      setAuthError('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser) return;

      // FALLBACK LOGIC: If DB has no code, allow default '1234'
      // This prevents lockout if users were created before the password column existed
      const storedCode = selectedUser.accessCode;
      const validCode = (storedCode && storedCode.trim() !== '') ? storedCode : '1234';

      if (passwordInput === validCode) {
          onLogin(selectedUser);
      } else {
          setAuthError('Contraseña incorrecta');
      }
  };

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Conectando a Nexus Cloud...</p>
            {initializing && <p className="text-xs text-gray-400 mt-2">Inicializando base de datos por primera vez...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
            <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <LogIn className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido a NexusOrder</h1>
            {!selectedUser ? (
                <p className="text-gray-500 mt-2">Seleccione su usuario para ingresar al sistema.</p>
            ) : (
                <p className="text-gray-500 mt-2">Ingrese su código de acceso.</p>
            )}
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {!selectedUser ? (
            /* User List View */
            <div className="space-y-3">
                {users.map(u => (
                    <button
                        key={u.id}
                        onClick={() => handleUserSelect(u)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-200 flex items-center justify-center text-gray-600 group-hover:text-blue-700 font-bold text-sm transition-colors">
                                {u.initials}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-800 group-hover:text-blue-800">{u.name}</p>
                                <p className="text-xs text-gray-500 group-hover:text-blue-600">{u.role}</p>
                            </div>
                        </div>
                        <div className="text-gray-300 group-hover:text-blue-500">→</div>
                    </button>
                ))}
            </div>
        ) : (
            /* Password View */
            <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-fade-in">
                 <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {selectedUser.initials}
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-800 text-sm">{selectedUser.name}</p>
                            <p className="text-xs text-gray-500">{selectedUser.role}</p>
                        </div>
                    </div>
                 </div>

                 <div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="text-gray-400 h-5 w-5" />
                        </div>
                        <input 
                            type="password" 
                            autoFocus
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ingrese su PIN (predeterminado: 1234)"
                        />
                    </div>
                    {authError && <p className="text-red-500 text-xs mt-2 text-center">{authError}</p>}
                 </div>

                 <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
                 >
                     Entrar
                 </button>

                 <button 
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 text-sm"
                 >
                     <ArrowLeft size={14} /> Elegir otro usuario
                 </button>
            </form>
        )}
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400">
                v1.5.1 (Secure Cloud) • Powered by Supabase
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;