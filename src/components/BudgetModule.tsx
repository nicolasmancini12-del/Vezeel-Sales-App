
import React, { useState, useEffect } from 'react';
import { Company, BudgetCategory, BudgetEntry, Order, ExchangeRate } from '../types';
import { getCompanies, getBudgetCategories, getBudgetEntries, saveBudgetEntry, getOrders, getExchangeRates, saveExchangeRate } from '../services/storageService';
import { ChevronLeft, ChevronRight, Loader2, Download, ArrowRight, AlertTriangle } from 'lucide-react';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type ViewMode = 'qty' | 'price' | 'total';

const BudgetModule = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [companies, setCompanies] = useState<Company[]>([]);
    const [categories, setCategories] = useState<BudgetCategory[]>([]);
    const [entries, setEntries] = useState<BudgetEntry[]>([]);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'plan' | 'real'>('plan');
    const [viewMode, setViewMode] = useState<ViewMode>('qty'); 
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [year]);

    const loadData = async () => {
        setLoading(true);
        setSaveError(null);
        try {
            const [compData, catData, entryData, ordersData, ratesData] = await Promise.all([
                getCompanies(),
                getBudgetCategories(),
                getBudgetEntries(year),
                getOrders(),
                getExchangeRates(year)
            ]);
            setCompanies(compData);
            setCategories(catData);
            setEntries(entryData);
            setOrders(ordersData);
            setExchangeRates(ratesData);
            
            if (compData.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(compData[0].id);
            }
        } catch (e: any) {
            console.error(e);
            setSaveError("Error cargando datos.");
        } finally {
            setLoading(false);
        }
    };

    const getEntry = (catId: string, monthIndex: number) => {
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        return entries.find(e => 
            e.companyId === selectedCompanyId && 
            e.categoryId === catId && 
            e.monthDate === monthStr
        ) || { quantity: 0, unitValue: 0, amount: 0 };
    };

    const getRate = (monthIndex: number) => {
        return exchangeRates.find(r => r.year === year && r.month === monthIndex)?.rate || 0;
    };

    const handleRateChange = async (monthIndex: number, val: string) => {
        const num = parseFloat(val) || 0;
        const newRates = [...exchangeRates];
        const idx = newRates.findIndex(r => r.year === year && r.month === monthIndex);
        if (idx >= 0) {
            newRates[idx].rate = num;
        } else {
            newRates.push({ id: Math.random().toString(), year, month: monthIndex, rate: num });
        }
        setExchangeRates(newRates);
        await saveExchangeRate({ year, month: monthIndex, rate: num });
    };

    const handleEntryChange = (catId: string, monthIndex: number, field: 'quantity' | 'unitValue', val: string) => {
        const num = parseFloat(val);
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        const currentEntry = getEntry(catId, monthIndex);
        
        let newQty = currentEntry.quantity;
        let newPrice = currentEntry.unitValue;

        if (field === 'quantity') newQty = isNaN(num) ? 0 : num;
        if (field === 'unitValue') newPrice = isNaN(num) ? 0 : num;

        const newAmount = newQty * newPrice;

        const entryPayload: Partial<BudgetEntry> = {
            companyId: selectedCompanyId,
            categoryId: catId,
            monthDate: monthStr,
            quantity: newQty,
            unitValue: newPrice,
            amount: newAmount
        };

        const existingIdx = entries.findIndex(e => e.companyId === selectedCompanyId && e.categoryId === catId && e.monthDate === monthStr);
        const newEntries = [...entries];
        if (existingIdx >= 0) {
            newEntries[existingIdx] = { ...newEntries[existingIdx], ...entryPayload } as BudgetEntry;
        } else {
            newEntries.push({ id: Math.random().toString(), ...entryPayload } as BudgetEntry);
        }
        setEntries(newEntries);
        saveToDb(entryPayload);
    };

    const saveToDb = async (entry: Partial<BudgetEntry>) => {
        setSaving(true);
        try {
            await saveBudgetEntry(entry);
        } catch (error: any) {
            console.error("Failed to save budget", error);
            setSaveError("Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const handleProjectRight = (catId: string, startMonthIdx: number) => {
        const base = getEntry(catId, startMonthIdx);
        for (let i = startMonthIdx + 1; i < 12; i++) {
            handleEntryChange(catId, i, 'quantity', base.quantity.toString());
            handleEntryChange(catId, i, 'unitValue', base.unitValue.toString());
        }
    };

    // Styling constants to ensure sticky works perfectly
    const stickyHeaderStyle: React.CSSProperties = {
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#f9fafb',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    };

    const stickyColStyle: React.CSSProperties = {
        position: 'sticky',
        left: 0,
        zIndex: 20,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        boxShadow: '2px 0 4px rgba(0,0,0,0.05)'
    };

    const renderCell = (catId: string, monthIndex: number) => {
        const entry = getEntry(catId, monthIndex);
        if (activeTab === 'real') return <div className="text-gray-300 text-[10px] text-center">-</div>;

        return (
            <div className="flex flex-col gap-1 h-full justify-center group relative min-h-[40px]">
                {(viewMode === 'qty' || viewMode === 'total') && (
                    <div className="flex items-center">
                        <span className="text-[8px] text-gray-400 w-3">Q</span>
                        <input 
                            type="number"
                            className="w-full text-right text-xs font-medium text-gray-700 border-none bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 rounded p-0"
                            value={entry.quantity || ''}
                            placeholder="-"
                            onChange={(e) => handleEntryChange(catId, monthIndex, 'quantity', e.target.value)}
                        />
                    </div>
                )}
                {(viewMode === 'price' || viewMode === 'qty') && (
                    <div className="flex items-center">
                        <span className="text-[8px] text-gray-400 w-3">$</span>
                        <input 
                            type="number"
                            className="w-full text-right text-xs text-gray-500 border-none bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 rounded p-0"
                            value={entry.unitValue || ''}
                            placeholder="-"
                            onChange={(e) => handleEntryChange(catId, monthIndex, 'unitValue', e.target.value)}
                        />
                    </div>
                )}
                <div className="border-t border-gray-100 pt-0.5 mt-0.5 text-right">
                    <span className="text-xs font-bold text-gray-900 block">
                        ${entry.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <button 
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 bg-white rounded shadow-sm z-10 border border-gray-200"
                    title="Replicar a la derecha"
                    onClick={() => handleProjectRight(catId, monthIndex)}
                >
                    <ArrowRight size={10} />
                </button>
            </div>
        );
    };

    const renderSection = (title: string, type: 'Ingreso' | 'Costo Directo' | 'Costo Indirecto', bgColor: string, textColor: string) => {
        const sectionCats = categories.filter(c => {
             return c.type === type && 
             (!c.assignedCompanyIds || c.assignedCompanyIds.length === 0 || c.assignedCompanyIds.includes(selectedCompanyId));
        });

        if (sectionCats.length === 0) return null;

        const monthTotals = Array(12).fill(0);
        let grandTotal = 0;

        sectionCats.forEach(cat => {
            MONTHS.forEach((_, idx) => {
                const entry = getEntry(cat.id, idx);
                monthTotals[idx] += entry.amount;
                grandTotal += entry.amount;
            });
        });

        return (
            <>
                <tr className={`${bgColor} border-b border-gray-200`}>
                    <td className={`px-4 py-2 text-xs font-bold ${textColor} uppercase tracking-wider`} style={{...stickyColStyle, backgroundColor: bgColor}}>
                        {title}
                    </td>
                    {MONTHS.map((_, i) => <td key={i} className={`${bgColor}`}></td>)}
                    <td className={`${bgColor}`}></td>
                </tr>
                
                {sectionCats.map(cat => {
                    let rowTotal = 0;
                    MONTHS.forEach((_, idx) => rowTotal += getEntry(cat.id, idx).amount);

                    return (
                        <tr key={cat.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 group">
                            <td className="px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between min-w-[250px]" style={stickyColStyle}>
                                <span className="truncate w-48" title={cat.name}>{cat.name}</span>
                            </td>
                            {MONTHS.map((_, idx) => (
                                <td key={idx} className="px-2 py-1.5 border-r border-dashed border-gray-100 min-w-[110px] relative">
                                    {renderCell(cat.id, idx)}
                                </td>
                            ))}
                            <td className="px-2 py-1.5 border-l border-gray-200 bg-gray-50 text-right min-w-[120px]">
                                <div className="flex h-full items-center justify-end font-bold text-gray-800 text-xs">
                                    ${rowTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </td>
                        </tr>
                    );
                })}

                <tr className={`${bgColor} border-t border-gray-300 font-bold`}>
                    <td className={`px-4 py-2 text-xs text-gray-700 text-right`} style={{...stickyColStyle, backgroundColor: bgColor}}>
                        TOTAL {title}
                    </td>
                    {monthTotals.map((total, idx) => (
                        <td key={idx} className="px-2 py-2 text-right border-r border-gray-200 bg-gray-50">
                            <span className="text-xs text-gray-900">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </td>
                    ))}
                    <td className="px-2 py-2 text-right border-l border-gray-300 bg-gray-200">
                        <span className="text-xs font-bold text-gray-900">${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </td>
                </tr>
            </>
        );
    };

    if (loading && companies.length === 0) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            {/* TOOLBAR */}
            <div className="border-b border-gray-200 bg-white px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-40 relative shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('plan')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'plan' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>Plan</button>
                        <button onClick={() => setActiveTab('real')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${activeTab === 'real' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>Real</button>
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex gap-2">
                        <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2">
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg">
                            <button onClick={() => setYear(year - 1)} className="px-2 text-gray-500 hover:text-blue-600"><ChevronLeft size={16}/></button>
                            <span className="px-2 text-sm font-bold text-gray-800">{year}</span>
                            <button onClick={() => setYear(year + 1)} className="px-2 text-gray-500 hover:text-blue-600"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button onClick={() => setViewMode('qty')} className={`p-1.5 rounded ${viewMode === 'qty' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`} title="Cantidad y Precio"><span className="text-xs font-bold px-1">Q</span></button>
                        <button onClick={() => setViewMode('price')} className={`p-1.5 rounded ${viewMode === 'price' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`} title="Solo Precio"><span className="text-xs font-bold px-1">$</span></button>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium shadow-sm">
                        <Download size={16} /> Exportar
                    </button>
                </div>
            </div>

            {saveError && <div className="bg-red-50 text-red-700 text-sm px-6 py-2 border-b border-red-200 flex items-center gap-2"><AlertTriangle size={16} />{saveError}</div>}

            {/* MAIN GRID */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-white relative">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" style={{...stickyHeaderStyle, ...stickyColStyle, zIndex: 60}}>
                                Concepto / P&L
                            </th>
                            {MONTHS.map(m => (
                                <th key={m} className="px-2 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[110px]" style={stickyHeaderStyle}>
                                    {m.slice(0,3)}
                                </th>
                            ))}
                            <th className="px-2 py-3 text-center text-xs font-extrabold text-gray-800 uppercase tracking-wider min-w-[120px]" style={stickyHeaderStyle}>
                                TOTAL ANUAL
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        <tr className="bg-blue-50/50 border-b border-blue-100">
                            <td className="px-4 py-3 text-xs font-bold text-blue-800" style={{...stickyColStyle, backgroundColor: '#eff6ff', borderRight: '1px solid #bfdbfe'}}>
                                TC (USD)
                            </td>
                            {MONTHS.map((_, i) => (
                                <td key={i} className="px-2 py-2 text-center border-r border-blue-100">
                                    <input 
                                        type="number"
                                        className="w-full text-center text-sm font-bold text-blue-700 bg-transparent border-b border-blue-200 focus:border-blue-500 outline-none"
                                        value={getRate(i) || ''}
                                        placeholder="1.0"
                                        onChange={(e) => handleRateChange(i, e.target.value)}
                                    />
                                </td>
                            ))}
                            <td className="bg-blue-50 border-l border-blue-100"></td>
                        </tr>

                        {renderSection('INGRESOS', 'Ingreso', 'bg-gray-100', 'text-gray-700')}
                        {renderSection('COSTOS DIRECTOS', 'Costo Directo', 'bg-white', 'text-gray-700')}
                        {renderSection('COSTOS INDIRECTOS', 'Costo Indirecto', 'bg-white', 'text-gray-700')}
                    </tbody>
                </table>
            </div>
            
            {saving && (
                <div className="absolute bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs z-50">
                    <Loader2 size={14} className="animate-spin" /> Guardando...
                </div>
            )}
        </div>
    );
};

export default BudgetModule;
