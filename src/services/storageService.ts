
import { supabase } from '../supabaseClient';
import { Order, Client, Contractor, PriceListEntry, Company, User, WorkflowStatus, UnitOfMeasure, ServiceCatalogItem, BudgetCategory, BudgetEntry, ExchangeRate } from '../types';
import { MOCK_ORDERS, MOCK_CLIENTS, MOCK_CONTRACTORS, MOCK_PRICE_LIST, MOCK_COMPANIES, MOCK_USERS, DEFAULT_WORKFLOW, UNITS_OF_MEASURE, MOCK_SERVICES } from '../constants';

const queryWithRetry = async <T>(queryBuilder: any, retries = 3, delay = 1000): Promise<{ data: T | null, error: any }> => {
    for (let i = 0; i < retries; i++) {
        const { data, error } = await queryBuilder;
        if (!error) return { data, error: null };
        const message = error.message ? error.message.toLowerCase() : '';
        const isCacheError = message.includes('schema cache') || error.code === 'PGRST200' || error.code === '42P01'; 
        if (isCacheError && i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
        }
        return { data: null, error };
    }
    return { data: null, error: { message: "Retries exhausted." } };
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
        await supabase.from('orders').insert(MOCK_ORDERS.map(o => ({...o, progress_logs: []})));
    }
};

export const getOrders = async (): Promise<Order[]> => {
    const { data, error } = await queryWithRetry<any[]>(supabase.from('orders').select('*'));
    if (error) return [];
    return data.map((d: any) => ({
        ...d,
        budgetCategoryId: d.budget_category_id,
        clientId: d.client_id,
        clientName: d.client_name,
        poNumber: d.po_number,
        serviceName: d.service_name,
        serviceDetails: d.service_details,
        unitOfMeasure: d.unit_of_measure,
        unitPrice: d.unit_price,
        unitCost: d.unit_cost,
        totalValue: d.total_value,
        contractorId: d.contractor_id,
        contractorName: d.contractor_name,
        operationsRep: d.operations_rep,
        commitmentDate: d.commitment_date,
        clientCertDate: d.client_cert_date,
        billingDate: d.billing_date,
        progressLogs: d.progress_logs || []
    }));
};

export const saveOrder = async (order: Order): Promise<Order[]> => {
    const dbOrder = {
             id: order.id, date: order.date, company: order.company, budget_category_id: order.budgetCategoryId,
             client_id: order.clientId, client_name: order.clientName, po_number: order.poNumber,
             service_name: order.serviceName, service_details: order.serviceDetails, unit_of_measure: order.unit_of_measure,
             quantity: order.quantity, unit_price: order.unitPrice, unit_cost: order.unitCost, total_value: order.total_value,
             contractor_id: order.contractorId, contractor_name: order.contractorName, status: order.status,
             operations_rep: order.operationsRep, observations: order.observations,
             commitment_date: order.commitmentDate, client_cert_date: order.clientCertDate, billing_date: order.billingDate,
             history: order.history, attachments: order.attachments, progress_logs: order.progress_logs
    };
    const { error } = await supabase.from('orders').upsert(dbOrder);
    if (error) throw error;
    return getOrders();
};

export const deleteOrder = async (id: string): Promise<Order[]> => {
    await supabase.from('orders').delete().eq('id', id);
    return getOrders();
};

export const getClients = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('clients').select('*')); return (data || []).map(d => ({id: d.id, name: d.name, taxId: d.tax_id, contactName: d.contact_name})); };

// Added missing saveClient export
export const saveClient = async (item: Client) => {
    await supabase.from('clients').upsert({ id: item.id, name: item.name, tax_id: item.taxId, contact_name: item.contactName });
    return getClients();
};

// Added missing deleteClient export
export const deleteClient = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
    return getClients();
};

export const getContractors = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('contractors').select('*')); return data || []; };

// Added missing saveContractor export
export const saveContractor = async (item: Contractor) => {
    await supabase.from('contractors').upsert(item);
    return getContractors();
};

// Added missing deleteContractor export
export const deleteContractor = async (id: string) => {
    await supabase.from('contractors').delete().eq('id', id);
    return getContractors();
};

export const getCompanies = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('companies').select('*')); return data || []; };

// Added missing saveCompany export
export const saveCompany = async (item: Company) => {
    await supabase.from('companies').upsert(item);
    return getCompanies();
};

// Added missing deleteCompany export
export const deleteCompany = async (id: string) => {
    await supabase.from('companies').delete().eq('id', id);
    return getCompanies();
};

export const getUsers = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('users').select('*')); return (data || []).map(u => ({id: u.id, name: u.name, role: u.role, initials: u.initials, accessCode: u.access_code})); };

// Added missing saveUser export
export const saveUser = async (item: User) => {
    const dbUser = { id: item.id, name: item.name, role: item.role, initials: item.initials, access_code: item.accessCode };
    const { error } = await supabase.from('users').upsert(dbUser);
    if (error) throw error;
    return getUsers();
};

// Added missing deleteUser export
export const deleteUser = async (id: string) => {
    await supabase.from('users').delete().eq('id', id);
    return getUsers();
};

export const getWorkflow = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('workflow_statuses').select('*').order('order')); return data || []; };

// Added missing saveWorkflowStatus export
export const saveWorkflowStatus = async (item: WorkflowStatus) => {
    await supabase.from('workflow_statuses').upsert(item);
    return getWorkflow();
};

// Added missing deleteWorkflowStatus export
export const deleteWorkflowStatus = async (id: string) => {
    await supabase.from('workflow_statuses').delete().eq('id', id);
    return getWorkflow();
};

export const getUnits = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('units_of_measure').select('*')); return data || []; };

// Added missing saveUnit export
export const saveUnit = async (item: UnitOfMeasure) => {
    await supabase.from('units_of_measure').upsert(item);
    return getUnits();
};

// Added missing deleteUnit export
export const deleteUnit = async (id: string) => {
    await supabase.from('units_of_measure').delete().eq('id', id);
    return getUnits();
};

export const getServices = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('service_catalog').select('*')); return data || []; };

// Added missing saveService export
export const saveService = async (item: ServiceCatalogItem) => {
    await supabase.from('service_catalog').upsert(item);
    return getServices();
};

// Added missing deleteService export
export const deleteService = async (id: string) => {
    await supabase.from('service_catalog').delete().eq('id', id);
    return getServices();
};

export const getPriceList = async () => { const { data } = await queryWithRetry<any[]>(supabase.from('price_list').select('*')); return (data || []).map(d => ({id: d.id, serviceName: d.service_name, company: d.company, contractorId: d.contractor_id, clientId: d.client_id, unitOfMeasure: d.unit_of_measure, unitPrice: d.unit_price, contractorCost: d.contractor_cost, validFrom: d.valid_from, validTo: d.valid_to})); };

// Added missing savePriceListEntry export
export const savePriceListEntry = async (entry: PriceListEntry) => {
    const dbEntry = {
        id: entry.id, service_name: entry.serviceName, company: entry.company, contractor_id: entry.contractorId,
        client_id: entry.clientId, unit_of_measure: entry.unitOfMeasure, unit_price: entry.unitPrice,
        contractor_cost: entry.contractorCost, valid_from: entry.validFrom, valid_to: entry.validTo
    };
    await supabase.from('price_list').upsert(dbEntry);
    return getPriceList();
};

// Added missing deletePriceListEntry export
export const deletePriceListEntry = async (id: string) => {
    await supabase.from('price_list').delete().eq('id', id);
    return getPriceList();
};

export const getBudgetCategories = async (): Promise<BudgetCategory[]> => {
    const { data } = await queryWithRetry<any[]>(supabase.from('app_budget_categories').select('*').order('order_index'));
    return (data || []).map(d => ({ id: d.id, name: d.name, type: d.type, orderIndex: d.order_index, assignedCompanyIds: d.company_ids || [] }));
};

export const saveBudgetCategory = async (cat: BudgetCategory) => { await supabase.from('app_budget_categories').upsert({ id: cat.id, name: cat.name, type: cat.type, order_index: cat.orderIndex, company_ids: cat.assignedCompanyIds || [] }); return getBudgetCategories(); };
export const deleteBudgetCategory = async (id: string) => { await supabase.from('app_budget_categories').delete().eq('id', id); return getBudgetCategories(); };

export const getBudgetEntries = async (year: number): Promise<BudgetEntry[]> => {
    const { data } = await queryWithRetry<any[]>(supabase.from('app_budget_entries').select('*').gte('month_date', `${year}-01-01`).lte('month_date', `${year}-12-31`));
    return (data || []).map(d => ({ id: d.id, companyId: d.company_id, categoryId: d.category_id, monthDate: d.month_date, quantity: d.quantity || 0, unitValue: d.unit_value || 0, amount: d.amount }));
};

export const saveBudgetEntry = async (entry: Partial<BudgetEntry>) => { await supabase.from('app_budget_entries').upsert({ company_id: entry.companyId, category_id: entry.categoryId, month_date: entry.monthDate, quantity: entry.quantity, unit_value: entry.unitValue, amount: entry.amount }, { onConflict: 'company_id,category_id,month_date' }); };
export const getExchangeRates = async (year: number) => { const { data } = await queryWithRetry<any[]>(supabase.from('app_budget_rates').select('*').eq('year', year)); return data || []; };
export const saveExchangeRate = async (rate: Partial<ExchangeRate>) => { await supabase.from('app_budget_rates').upsert(rate, { onConflict: 'year,month' }); };

export const checkBudgetConnection = async () => {
    const { error } = await supabase.from('app_budget_categories').select('id').limit(1);
    if (error) return { success: false, message: error.message };
    return { success: true };
};

export const exportBackup = async () => {
    const [o, c, ct, co, p, u, w, un, s, bc] = await Promise.all([getOrders(), getClients(), getContractors(), getCompanies(), getPriceList(), getUsers(), getWorkflow(), getUnits(), getServices(), getBudgetCategories()]);
    return JSON.stringify({ orders: o, clients: c, contractors: ct, companies: co, prices: p, users: u, workflow: w, units: un, services: s, budgetCategories: bc, timestamp: new Date().toISOString(), version: '1.6-unified' }, null, 2);
};
