
// --- CORE TYPES ---

export interface WorkflowStatus {
  id: string;
  name: string;
  color: string; 
  order: number;
}

export interface Company {
  id: string;
  name: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category?: string;
}

export interface User {
  id: string;
  name: string;
  role: string; // 'Admin', 'Operaciones', 'Comercial', 'Lector'
  initials: string;
  accessCode?: string;
}

// --- COMMERCIAL / BUDGET MODULE (UPDATED) ---

export interface ExchangeRate {
    id: string;
    year: number;
    month: number; // 0-11
    rate: number;
}

export interface BudgetCategory {
    id: string;
    name: string;
    // Expanded types for better P&L structure
    type: 'Ingreso' | 'Costo Directo' | 'Costo Indirecto'; 
    orderIndex: number;
    assignedCompanyIds?: string[]; // New: Link specific companies
}

export interface BudgetEntry {
    id: string;
    companyId: string;
    categoryId: string;
    monthDate: string; // YYYY-MM-DD (Siempre dia 01)
    quantity: number;  // New: Input base
    unitValue: number; // New: Input base
    amount: number;    // Calculated (Qty * UnitValue)
}

// --- OPERATIONAL MODULE ---

export interface Client {
  id: string;
  name: string;
  taxId?: string;
  contactName?: string;
}

export interface Contractor {
  id: string;
  name: string;
  specialty?: string;
  company?: string; 
}

export interface PriceListEntry {
  id: string;
  serviceName: string;
  company: string; 
  contractorId?: string;
  clientId?: string; 
  unitOfMeasure: string; 
  unitPrice: number;
  contractorCost?: number; 
  validFrom: string; 
  validTo: string; 
}

export interface OrderHistoryEntry {
  date: string;
  user: string;
  action: string;
  details: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  date: string;
}

export interface ProgressLogEntry {
    id: string;
    date: string;
    quantity: number;
    certificationDate?: string;
    billingDate?: string;
    notes: string;
    user: string;
}

export interface Order {
  id: string;
  date: string;
  company: string; // Selling Company
  
  // Link al Presupuesto
  budgetCategoryId: string; 

  clientId: string; 
  clientName: string; 
  poNumber: string; 
  
  serviceName: string;
  serviceDetails?: string; 
  
  unitOfMeasure: string; 
  quantity: number;
  unitPrice: number;
  unitCost?: number; 
  
  totalValue: number; // Calculated in UI/DB
  
  contractorId?: string; 
  contractorName?: string; 
  
  status: string; 
  operationsRep: string; 
  observations: string;
  
  commitmentDate?: string; 
  clientCertDate?: string; 
  billingDate?: string;    

  history?: OrderHistoryEntry[];
  attachments?: Attachment[];
  progressLogs?: ProgressLogEntry[];
}

export type OrderFormData = Omit<Order, 'id' | 'totalValue' | 'clientName' | 'contractorName' | 'history' | 'attachments' | 'progressLogs'>;

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  ordersByStatus: { name: string; value: number; color: string }[];
  revenueByCompany: { name: string; value: number }[];
}
