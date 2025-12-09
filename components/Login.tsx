import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers, initDatabase } from '../services/storageService';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);

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
            <p className="text-gray-500 mt-2">Seleccione su usuario para ingresar al sistema.</p>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <div className="space-y-3">
            {users.map(u => (
                <button
                    key={u.id}
                    onClick={() => onLogin(u)}
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
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400">
                v1.4.0 (Cloud Edition) • Powered by Supabase
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;