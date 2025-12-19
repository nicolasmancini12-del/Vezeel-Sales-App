
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Order } from '../types';
import { DollarSign, Activity, CheckCircle, TrendingUp, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface Props {
  orders: Order[];
}

const Dashboard: React.FC<Props> = ({ orders }) => {
  // Calculate Stats
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalValue, 0);
  const totalCost = orders.reduce((acc, o) => acc + ((o.unitCost || 0) * o.quantity), 0);
  const totalMargin = totalRevenue - totalCost;
  const overallMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const activeOrders = orders.filter(o => o.status !== 'Facturado' && o.status !== 'Certificado');
  const activeOrdersCount = activeOrders.length;
  const completedOrders = orders.filter(o => o.status === 'Facturado').length;

  // Operational Progress Data (Active Projects)
  const operationalProgress = activeOrders.map(o => {
      const totalProgress = o.progressLogs?.reduce((acc, log) => acc + log.quantity, 0) || 0;
      const percent = o.quantity > 0 ? Math.min((totalProgress / o.quantity) * 100, 100) : 0;
      const dueDate = o.commitmentDate ? new Date(o.commitmentDate) : null;
      const now = new Date();
      const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;
      
      return {
          id: o.id,
          client: o.clientName,
          service: o.serviceName,
          percent,
          daysLeft,
          status: o.status,
          rep: o.operationsRep
      };
  }).sort((a,b) => (a.daysLeft || 999) - (b.daysLeft || 999)).slice(0, 10); // Show top 10 urgent

  // Data for Revenue by Company
  const revenueByCompanyMap = orders.reduce((acc, order) => {
    acc[order.company] = (acc[order.company] || 0) + order.totalValue;
    return acc;
  }, {} as Record<string, number>);

  const revenueData = Object.keys(revenueByCompanyMap).map(key => ({
    name: key.split(' ')[0], // Shorten name for chart
    revenue: revenueByCompanyMap[key]
  }));

  // Data for Status Distribution
  const statusMap = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusMap).map(key => ({
    name: key,
    value: statusMap[key]
  }));

  // Data for Revenue Trend (Monthly)
  const monthlyRevenue = orders.reduce((acc, order) => {
      const date = new Date(order.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + order.totalValue;
      return acc;
  }, {} as Record<string, number>);
  
  const trendData = Object.keys(monthlyRevenue).sort().map(key => ({
      date: key,
      total: monthlyRevenue[key]
  })).slice(-6); 

  // Colors
  const PIE_COLORS = ['#fbbf24', '#60a5fa', '#a78bfa', '#818cf8', '#facc15', '#34d399', '#4ade80'];

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtext && <p className="text-xs text-emerald-600 font-medium mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Rentabilidad (Margen)" 
          value={`$${totalMargin.toLocaleString()}`} 
          subtext={`${overallMarginPercent.toFixed(1)}% Margen Promedio`}
          icon={TrendingUp} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="En Proceso" 
          value={activeOrdersCount} 
          icon={Activity} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Facturados" 
          value={completedOrders} 
          icon={CheckCircle} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OPERATIONAL PROGRESS TABLE (NEW) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                 <Clock size={20} className="text-blue-500"/>
                 Seguimiento Operativo (Proyectos Activos)
             </h3>
             <div className="overflow-x-auto">
                 <table className="min-w-full">
                     <thead>
                         <tr className="border-b border-gray-100 text-left">
                             <th className="py-2 text-xs font-bold text-gray-500 uppercase">Proyecto / Cliente</th>
                             <th className="py-2 text-xs font-bold text-gray-500 uppercase">Avance</th>
                             <th className="py-2 text-xs font-bold text-gray-500 uppercase">Entrega</th>
                             <th className="py-2 text-xs font-bold text-gray-500 uppercase">Resp.</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                         {operationalProgress.length === 0 ? (
                             <tr><td colSpan={4} className="py-4 text-center text-sm text-gray-400">No hay proyectos activos con seguimiento.</td></tr>
                         ) : operationalProgress.map(p => (
                             <tr key={p.id}>
                                 <td className="py-3 pr-4">
                                     <div className="font-medium text-sm text-gray-800">{p.service}</div>
                                     <div className="text-xs text-gray-500">{p.client}</div>
                                 </td>
                                 <td className="py-3 pr-4 w-1/3">
                                     <div className="flex justify-between text-xs mb-1">
                                         <span className="font-medium">{Math.round(p.percent)}%</span>
                                         <span className="text-gray-400">{p.status}</span>
                                     </div>
                                     <div className="w-full bg-gray-100 rounded-full h-2">
                                         <div 
                                            className={`h-2 rounded-full ${p.percent === 100 ? 'bg-green-500' : p.percent > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                            style={{width: `${p.percent}%`}}
                                         ></div>
                                     </div>
                                 </td>
                                 <td className="py-3 pr-4">
                                     {p.daysLeft !== null ? (
                                         <div className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${p.daysLeft < 0 ? 'bg-red-50 text-red-600' : p.daysLeft < 7 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'}`}>
                                             {p.daysLeft < 0 && <AlertTriangle size={10} />}
                                             {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)} días atraso` : `${p.daysLeft} días`}
                                         </div>
                                     ) : <span className="text-xs text-gray-400">-</span>}
                                 </td>
                                 <td className="py-3 text-xs text-gray-500">
                                     {p.rep ? p.rep.split(' ')[0] : '-'}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>

        {/* Status Distribution (Compact) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Estado General</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Ingresos por Empresa</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(val) => `$${val/1000}k`} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Tendencia de Ingresos</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                         <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(val) => `$${val/1000}k`} />
                         <RechartsTooltip />
                         <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
