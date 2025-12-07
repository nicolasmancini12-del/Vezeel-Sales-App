
import { Order, Client, Contractor, PriceListEntry, Company, User, WorkflowStatus } from '../types';
import { MOCK_ORDERS, MOCK_CLIENTS, MOCK_CONTRACTORS, MOCK_PRICE_LIST, MOCK_COMPANIES, MOCK_USERS, DEFAULT_WORKFLOW } from '../constants';

const KEYS = {
  ORDERS: 'nexus_orders_v2',
  CLIENTS: 'nexus_clients_v1',
  CONTRACTORS: 'nexus_contractors_v2', 
  PRICES: 'nexus_prices_v1',
  COMPANIES: 'nexus_companies_v1',
  USERS: 'nexus_users_v1',
  WORKFLOW: 'nexus_workflow_v1'
};

// Helper for generic CRUD
const getList = <T>(key: string, mock: T[]): T[] => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(mock));
    return mock;
  }
  return JSON.parse(stored);
};

const saveItem = <T extends { id: string }>(key: string, item: T): T[] => {
  const list = getList<T>(key, []);
  const index = list.findIndex(i => i.id === item.id);
  let newList;
  if (index >= 0) {
    newList = [...list];
    newList[index] = item;
  } else {
    newList = [item, ...list];
  }
  localStorage.setItem(key, JSON.stringify(newList));
  return newList;
};

const deleteItem = <T extends { id: string }>(key: string, id: string): T[] => {
  const list = getList<T>(key, []);
  const newList = list.filter(i => i.id !== id);
  localStorage.setItem(key, JSON.stringify(newList));
  return newList;
};

// --- Orders ---
export const getOrders = () => getList<Order>(KEYS.ORDERS, MOCK_ORDERS);
export const saveOrder = (order: Order) => saveItem(KEYS.ORDERS, order);
export const deleteOrder = (id: string) => deleteItem<Order>(KEYS.ORDERS, id);

// --- Clients ---
export const getClients = () => getList<Client>(KEYS.CLIENTS, MOCK_CLIENTS);
export const saveClient = (client: Client) => saveItem(KEYS.CLIENTS, client);
export const deleteClient = (id: string) => deleteItem<Client>(KEYS.CLIENTS, id);

// --- Contractors ---
export const getContractors = () => getList<Contractor>(KEYS.CONTRACTORS, MOCK_CONTRACTORS);
export const saveContractor = (c: Contractor) => saveItem(KEYS.CONTRACTORS, c);
export const deleteContractor = (id: string) => deleteItem<Contractor>(KEYS.CONTRACTORS, id);

// --- Companies ---
export const getCompanies = () => getList<Company>(KEYS.COMPANIES, MOCK_COMPANIES);
export const saveCompany = (c: Company) => saveItem(KEYS.COMPANIES, c);
export const deleteCompany = (id: string) => deleteItem<Company>(KEYS.COMPANIES, id);

// --- Price List ---
export const getPriceList = () => getList<PriceListEntry>(KEYS.PRICES, MOCK_PRICE_LIST);
export const savePriceListEntry = (entry: PriceListEntry) => saveItem(KEYS.PRICES, entry);
export const deletePriceListEntry = (id: string) => deleteItem<PriceListEntry>(KEYS.PRICES, id);

// --- Users ---
export const getUsers = () => getList<User>(KEYS.USERS, MOCK_USERS);
export const saveUser = (u: User) => saveItem(KEYS.USERS, u);
export const deleteUser = (id: string) => deleteItem<User>(KEYS.USERS, id);

// --- Workflow (New) ---
export const getWorkflow = () => getList<WorkflowStatus>(KEYS.WORKFLOW, DEFAULT_WORKFLOW).sort((a,b) => a.order - b.order);
export const saveWorkflowStatus = (w: WorkflowStatus) => {
    const list = getWorkflow();
    // If saving, sort by order automatically might be nice, but we just save for now
    const saved = saveItem(KEYS.WORKFLOW, w);
    return saved.sort((a,b) => a.order - b.order);
}
export const deleteWorkflowStatus = (id: string) => deleteItem<WorkflowStatus>(KEYS.WORKFLOW, id);
