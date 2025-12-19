
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
  role: string; // 'Admin', 'Operaciones', 'Lector'
  initials: string;
  accessCode?: string;
}

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

// Budgeting related interfaces
export interface BudgetCategory {
  id: string;
  name: string;
  type: 'Ingreso' | 'Costo Directo' | 'Costo Indirecto';
  assignedCompanyIds?: string[];
}

export interface BudgetEntry {
  id: string;
  companyId: string;
  categoryId: string;
  monthDate: string; // ISO Date YYYY-MM-01
  quantity: number;
  unitValue: number;
  amount: number;
}

export interface ExchangeRate {
  id: string;
  year: number;
  month: number;
  rate: number;
}

export interface Order {
  id: string;
  date: string;
  company: string; 
  clientId: string; 
  clientName: string; 
  poNumber: string; 
  budgetCategoryId?: string; // Support for Budget Module integration
  serviceName: string;
  serviceDetails?: string; 
  unitOfMeasure: string; 
  quantity: number;
  unitPrice: number;
  unitCost?: number; 
  totalValue: number;
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
