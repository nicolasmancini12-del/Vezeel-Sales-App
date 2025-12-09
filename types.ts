
// Dynamic Status Interface (New)
export interface WorkflowStatus {
  id: string;
  name: string;
  color: string; // tailwind class reference or hex
  order: number;
}

// Dynamic Company Interface (formerly an Enum)
export interface Company {
  id: string;
  name: string;
}

// Unit of Measure Interface (New)
export interface UnitOfMeasure {
  id: string;
  name: string;
}

// Service Catalog Interface (New - Master Data)
export interface ServiceCatalogItem {
  id: string;
  name: string;
  category?: string;
}

// User Interface
export interface User {
  id: string;
  name: string;
  role: string; // 'Admin', 'Operaciones', 'Lector'
  initials: string;
  accessCode?: string; // Password or PIN
}

// Master Data Types
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
  company?: string; // Linked Selling Company
}

export interface PriceListEntry {
  id: string;
  serviceName: string; // Now normalized via Catalog
  company: string; 
  contractorId?: string;
  clientId?: string; // Specific client pricing
  unitOfMeasure: string; 
  unitPrice: number;
  contractorCost?: number; 
  validFrom: string; 
  validTo: string; 
}

// --- NEW INTERFACES FOR AUDIT & DOCS ---

export interface OrderHistoryEntry {
  date: string; // ISO Timestamp
  user: string;
  action: string; // 'Creado', 'Editado', 'Cambio Estado'
  details: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  date: string;
}

export interface Order {
  id: string;
  date: string; // ISO String - Creation Date
  company: string; // Stored as name
  clientId: string; 
  clientName: string; 
  poNumber: string; 
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
  
  // Date Fields
  commitmentDate?: string; 
  clientCertDate?: string; 
  billingDate?: string;    

  // New Fields
  history?: OrderHistoryEntry[];
  attachments?: Attachment[];
}

export type OrderFormData = Omit<Order, 'id' | 'totalValue' | 'clientName' | 'contractorName' | 'history' | 'attachments'>;

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  ordersByStatus: { name: string; value: number; color: string }[];
  revenueByCompany: { name: string; value: number }[];
}
