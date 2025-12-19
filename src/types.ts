
// Workflow status definition for dynamic configuration
export interface WorkflowStatus {
  id: string;
  name: string;
  color: string; 
  order: number;
}

// Company entity definition
export interface Company {
  id: string;
  name: string;
}

// Unit of measure entity
export interface UnitOfMeasure {
  id: string;
  name: string;
}

// Service catalog for master data management
export interface ServiceCatalogItem {
  id: string;
  name: string;
  category?: string;
}

// User entity for authentication and roles
export interface User {
  id: string;
  name: string;
  role: string; 
  initials: string;
  accessCode?: string;
}

// Client entity for sales management
export interface Client {
  id: string;
  name: string;
  taxId?: string;
  contactName?: string;
}

// Contractor entity for service fulfillment
export interface Contractor {
  id: string;
  name: string;
  specialty?: string;
  company?: string; 
}

// Price list configuration for services
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

// Audit history for orders
export interface OrderHistoryEntry {
  date: string;
  user: string;
  action: string;
  details: string;
}

// External attachments linked to orders
export interface Attachment {
  id: string;
  name: string;
  url: string;
  date: string;
}

// Production progress tracking
export interface ProgressLogEntry {
    id: string;
    date: string; // Fecha de Producción
    quantity: number;
    certificationDate?: string; // Fecha Certificación del avance
    billingDate?: string;       // Fecha Facturación del avance
    notes: string;
    user: string;
}

// Budget category for financial planning
export interface BudgetCategory {
  id: string;
  name: string;
  type: 'Ingreso' | 'Costo Directo' | 'Costo Indirecto';
  assignedCompanyIds?: string[];
}

// Budget entry for a specific month and category
export interface BudgetEntry {
  id: string;
  companyId: string;
  categoryId: string;
  monthDate: string; // ISO format YYYY-MM-DD
  quantity: number;
  unitValue: number;
  amount: number;
}

// Exchange rate configuration per month
export interface ExchangeRate {
  id: string;
  year: number;
  month: number; // 0-11
  rate: number;
}

// Main Order entity
export interface Order {
  id: string;
  date: string; // Fecha Registro
  company: string; 
  clientId: string; 
  clientName: string; 
  poNumber: string; 
  budgetCategoryId?: string; // Link to budget category
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
  
  // FECHAS CABECERA
  commitmentDate?: string; 
  productionDate?: string; // Nueva: Fecha estimada/real producción total
  clientCertDate?: string; 
  billingDate?: string;    
  
  history?: OrderHistoryEntry[];
  attachments?: Attachment[];
  progressLogs?: ProgressLogEntry[];
}

export type OrderFormData = Omit<Order, 'id' | 'totalValue' | 'clientName' | 'contractorName' | 'history' | 'attachments' | 'progressLogs'>;
