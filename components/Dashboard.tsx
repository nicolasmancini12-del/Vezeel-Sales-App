
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Order } from '../types';
import { DollarSign, Briefcase, Activity, CheckCircle, TrendingUp } from 'lucide-react';

interface Props {
  orders: Order[];
}

const Dashboard: React.FC<Props> = ({ orders }) => {
  // Calculate Stats
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalValue, 0);
  const totalCost = orders.reduce((acc, o) => acc + ((o.unitCost || 0) * o.quantity), 0);
  const totalMargin = totalRevenue - totalCost;
  const overallMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const activeOrders = orders.filter(o => o.status !== 'Facturado' && o.status !== 'Certificado').length;
  const completedOrders = orders.filter(o => o.status === 'Facturado').length;

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

  // --- PROFITABILITY ANALYTICS ---

  // 1. Margin by Client
  const marginByClient = orders.reduce((acc, order) => {
      const revenue = order.totalValue;
      const cost = (order.unitCost || 0) * order.quantity;
      const margin = revenue - cost;
      acc[order.clientName] = (acc[order.clientName] || 0) + margin;
      return acc;
  }, {} as Record<string, number>);

  const clientMarginData = Object.keys(marginByClient)
    .map(key => ({ name: key, margin: marginByClient[key] }))
    .sort((a,b) => b.margin - a.margin)
    .slice(0, 5); // Top 5

  // 2. Margin by Service
  const marginByService = orders.reduce((acc, order) => {
      const revenue = order.totalValue;
      const cost = (order.unitCost || 0) * order.quantity;
      const margin = revenue - cost;
      acc[order.serviceName] = (acc[order.serviceName] || 0) + margin;
      return acc;
  }, {} as Record<string, number>);

  const serviceMarginData = Object.keys(marginByService)
    .map(key => ({ name: key, margin: marginByService[key] }))
    .sort((a,b) => b.margin - a.margin)
    .slice(0, 5);

   // 3. Margin by Contractor
   const marginByContractor = orders.reduce((acc, order) => {
      const name = order.contractorName || 'No Asignado';
      const revenue = order.totalValue;
      const cost = (order.unitCost || 0) * order.quantity;
      const margin = revenue - cost;
      acc[name] = (acc[name] || 0) + margin;
      return acc;
  }, {} as Record<string, number>);

  const contractorMarginData = Object.keys(marginByContractor)
    .map(key => ({ name: key, margin: marginByContractor[key] }))
    .sort((a,b) => b.margin - a.margin)
    .slice(0, 5);

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
          value={activeOrders} 
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

      {/* Main Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Ingresos por Empresa</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(val) => `$${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Estado de Pedidos</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Tendencia de Ingresos (Últimos 6 Meses)</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                         <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(val) => `$${val/1000}k`} />
                         <RechartsTooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         />
                         <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* PROFITABILITY SECTION */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 border-b pb-2">Análisis de Rentabilidad (Margen Bruto)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Top Clientes (Margen $)</h4>
             <div className="h-60 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={clientMarginData} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} interval={0} />
                         <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                         <Bar dataKey="margin" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Top Servicios (Margen $)</h4>
             <div className="h-60 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={serviceMarginData} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} interval={0} />
                         <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                         <Bar dataKey="margin" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Top Contratistas (Margen $)</h4>
             <div className="h-60 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={contractorMarginData} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} interval={0} />
                         <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                         <Bar dataKey="margin" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
