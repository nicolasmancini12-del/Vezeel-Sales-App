
import { supabase } from '../supabaseClient';
import { Order, Client, Contractor, PriceListEntry, Company, User, WorkflowStatus, UnitOfMeasure, ServiceCatalogItem, BudgetCategory, BudgetEntry, ExchangeRate } from '../types';
import { MOCK_ORDERS, MOCK_CLIENTS, MOCK_CONTRACTORS, MOCK_PRICE_LIST, MOCK_COMPANIES, MOCK_USERS, DEFAULT_WORKFLOW, UNITS_OF_MEASURE, MOCK_SERVICES } from '../constants';

const queryWithRetry = async <T>(queryFn: () => any, retries = 3, delay = 1000): Promise<{ data: T | null, error: any }> => {
    for (let i = 0; i < retries; i++) {
        try {
            const { data, error } = await queryFn();
            if (!error) return { data, error: null };
            console.warn(`Intento ${i+1} fallido:`, error.message);
        } catch (e: any) {
            console.warn(`Error en intento ${i+1}:`, e.message);
        }
        if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
    }
    return { data: null, error: { message: "Se agotaron los reintentos de conexión." } };
};

export const initDatabase = async () => {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (count === 0) {
        await supabase.from('companies').insert(MOCK_COMPANIES);
        await supabase.from('users').insert(MOCK_USERS.map(u => ({...u, access_code: '1234'})));
        await supabase.from('clients').insert(MOCK_CLIENTS);
        await supabase.from('contractors').insert(MOCK_CONTRACTORS.map(c => ({...c, company: c.company || ''})));
        await supabase.from('workflow_statuses').insert(DEFAULT_WORKFLOW);
        await supabase.from('service_catalog').insert(MOCK_SERVICES);
        const seedUnits = UNITS_OF_MEASURE.map(u => ({ id: Math.random().toString(36).substr(2, 9), name: u }));
        await supabase.from('units_of_measure').insert(seedUnits);
        await supabase.from('price_list').insert(MOCK_PRICE_LIST.map(p => ({
            id: p.id, service_name: p.serviceName, company: p.company, contractor_id: p.contractorId, client_id: p.clientId,
            unit_of_measure: p.unitOfMeasure, unit_price: p.unitPrice, contractor_cost: p.contractorCost,
            valid_from: p.validFrom, valid_to: p.validTo
        })));
    }
};

export const getOrders = async (): Promise<Order[]> => {
    const { data, error } = await queryWithRetry<any[]>(() => supabase.from('orders').select('*').order('date', {ascending: false}));
    if (error) return [];
    return (data || []).map((d: any) => ({
        ...d,
        clientId: d.client_id || '',
        clientName: d.client_name || '',
        poNumber: d.po_number || '',
        budgetCategoryId: d.budget_category_id || '',
        serviceName: d.service_name || '',
        serviceDetails: d.service_details || '',
        unitOfMeasure: d.unit_of_measure || 'Horas',
        unitPrice: d.unit_price || 0,
        unitCost: d.unit_cost || 0,
        totalValue: d.total_value || 0,
        contractorId: d.contractor_id || '',
        contractorName: d.contractor_name || '',
        operationsRep: d.operations_rep || '',
        commitmentDate: d.commitment_date || '',
        productionDate: d.production_date || '',
        clientCertDate: d.client_cert_date || '',
        billingDate: d.billing_date || '',
        progressLogs: d.progress_logs || []
    }));
};

export const saveOrder = async (order: Order): Promise<Order[]> => {
    // Limpieza profunda de datos para evitar undefined
    const dbOrder = {
             id: order.id, 
             date: order.date || new Date().toISOString().split('T')[0], 
             company: order.company || '',
             client_id: order.clientId || null, 
             client_name: order.clientName || '', 
             po_number: order.poNumber || '',
             budget_category_id: order.budgetCategoryId || null,
             service_name: order.serviceName || '', 
             service_details: order.serviceDetails || '', 
             unit_of_measure: order.unitOfMeasure || 'Horas',
             quantity: Number(order.quantity) || 0, 
             unit_price: Number(order.unitPrice) || 0, 
             unit_cost: Number(order.unitCost) || 0, 
             total_value: Number(order.totalValue) || 0,
             contractor_id: order.contractorId || null, 
             contractor_name: order.contractorName || '', 
             status: order.status || '',
             operations_rep: order.operationsRep || '', 
             observations: order.observations || '',
             commitment_date: order.commitmentDate || null, 
             production_date: order.productionDate || null,
             client_cert_date: order.clientCertDate || null, 
             billing_date: order.billingDate || null,
             history: order.history || [], 
             attachments: order.attachments || [], 
             progress_logs: order.progressLogs || []
    };
    
    const { error } = await supabase.from('orders').upsert(dbOrder);
    if (error) {
        console.error("Error crítico de guardado en Supabase:", error);
        throw new Error(error.message);
    }
    return getOrders();
};

export const deleteOrder = async (id: string): Promise<Order[]> => {
    await supabase.from('orders').delete().eq('id', id);
    return getOrders();
};

export const getClients = async () => { const { data } = await supabase.from('clients').select('*').order('name'); return (data || []).map(d => ({id: d.id, name: d.name, taxId: d.tax_id, contactName: d.contact_name})); };
export const saveClient = async (item: Client) => { await supabase.from('clients').upsert({ id: item.id, name: item.name, tax_id: item.taxId, contact_name: item.contactName }); return getClients(); };
// Added missing deleteClient
export const deleteClient = async (id: string) => { await supabase.from('clients').delete().eq('id', id); return getClients(); };

export const getContractors = async () => { const { data } = await supabase.from('contractors').select('*').order('name'); return data || []; };
export const saveContractor = async (item: Contractor) => { await supabase.from('contractors').upsert(item); return getContractors(); };
// Added missing deleteContractor
export const deleteContractor = async (id: string) => { await supabase.from('contractors').delete().eq('id', id); return getContractors(); };

export const getCompanies = async () => { const { data } = await supabase.from('companies').select('*').order('name'); return data || []; };
export const saveCompany = async (item: Company) => { await supabase.from('companies').upsert(item); return getCompanies(); };
// Added missing deleteCompany
export const deleteCompany = async (id: string) => { await supabase.from('companies').delete().eq('id', id); return getCompanies(); };

export const getUsers = async () => { const { data } = await supabase.from('users').select('*').order('name'); return (data || []).map(u => ({id: u.id, name: u.name, role: u.role, initials: u.initials, accessCode: u.access_code})); };
export const saveUser = async (item: User) => { await supabase.from('users').upsert({ id: item.id, name: item.name, role: item.role, initials: item.initials, access_code: item.accessCode }); return getUsers(); };
// Added missing deleteUser
export const deleteUser = async (id: string) => { await supabase.from('users').delete().eq('id', id); return getUsers(); };

export const getWorkflow = async () => { const { data } = await supabase.from('workflow_statuses').select('*').order('order'); return data || []; };
export const saveWorkflowStatus = async (item: WorkflowStatus) => { await supabase.from('workflow_statuses').upsert(item); return getWorkflow(); };
// Added missing deleteWorkflowStatus
export const deleteWorkflowStatus = async (id: string) => { await supabase.from('workflow_statuses').delete().eq('id', id); return getWorkflow(); };

export const getUnits = async () => { const { data } = await supabase.from('units_of_measure').select('*').order('name'); return data || []; };
export const saveUnit = async (item: UnitOfMeasure) => { await supabase.from('units_of_measure').upsert(item); return getUnits(); };
// Added missing deleteUnit
export const deleteUnit = async (id: string) => { await supabase.from('units_of_measure').delete().eq('id', id); return getUnits(); };

export const getServices = async () => { const { data } = await supabase.from('service_catalog').select('*').order('name'); return data || []; };
export const saveService = async (item: ServiceCatalogItem) => { await supabase.from('service_catalog').upsert(item); return getServices(); };
// Added missing deleteService
export const deleteService = async (id: string) => { await supabase.from('service_catalog').delete().eq('id', id); return getServices(); };

export const getPriceList = async () => { const { data } = await supabase.from('price_list').select('*'); return (data || []).map(d => ({id: d.id, serviceName: d.service_name, company: d.company, contractorId: d.contractor_id, clientId: d.client_id, unitOfMeasure: d.unit_of_measure, unitPrice: d.unit_price, contractorCost: d.contractor_cost, validFrom: d.valid_from, validTo: d.valid_to})); };
export const savePriceListEntry = async (entry: PriceListEntry) => { await supabase.from('price_list').upsert({ id: entry.id, service_name: entry.serviceName, company: entry.company, contractor_id: entry.contractorId, client_id: entry.clientId, unit_of_measure: entry.unitOfMeasure, unit_price: entry.unitPrice, contractor_cost: entry.contractorCost, valid_from: entry.validFrom, valid_to: entry.validTo }); return getPriceList(); };
// Added missing deletePriceListEntry
export const deletePriceListEntry = async (id: string) => { await supabase.from('price_list').delete().eq('id', id); return getPriceList(); };

export const getBudgetCategories = async () => { const { data } = await supabase.from('budget_categories').select('*').order('name'); return data || []; };
export const getBudgetEntries = async (year: number) => { const start = `${year}-01-01`; const end = `${year}-12-31`; const { data } = await supabase.from('budget_entries').select('*').gte('month_date', start).lte('month_date', end); return data || []; };
export const saveBudgetEntry = async (entry: any) => { await supabase.from('budget_entries').upsert(entry); };
export const getExchangeRates = async (year: number) => { const { data } = await supabase.from('exchange_rates').select('*').eq('year', year); return data || []; };
export const saveExchangeRate = async (rate: any) => { await supabase.from('exchange_rates').upsert(rate); };

export const exportBackup = async () => {
    const [o, c, ct, co, p, u, w, un, s] = await Promise.all([getOrders(), getClients(), getContractors(), getCompanies(), getPriceList(), getUsers(), getWorkflow(), getUnits(), getServices()]);
    return JSON.stringify({ orders: o, clients: c, contractors: ct, companies: co, prices: p, users: u, workflow: w, units: un, services: s, timestamp: new Date().toISOString(), version: '1.6-sales-app' }, null, 2);
};
