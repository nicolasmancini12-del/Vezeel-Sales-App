
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

// User Interface
export interface User {
  id: string;
  name: string;
  role: string; // 'Admin', 'Operaciones', 'Lector'
  initials: string;
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
  serviceName: string;
  company: string; 
  contractorId?: string;
  unitOfMeasure: string; 
  unitPrice: number;
  validFrom: string; 
  validTo: string; 
}

export interface Order {
  id: string;
  date: string; // ISO String - Creation Date
  company: string; // Stored as name
  clientId: string; 
  clientName: string; 
  poNumber: string; 
  serviceName: string;
  unitOfMeasure: string; 
  quantity: number;
  unitPrice: number;
  totalValue: number;
  contractorId?: string; 
  contractorName?: string; 
  status: string; // Now a dynamic string
  operationsRep: string; 
  observations: string;
  
  // Date Fields
  commitmentDate?: string; 
  clientCertDate?: string; 
  billingDate?: string;    
}

export type OrderFormData = Omit<Order, 'id' | 'totalValue' | 'clientName' | 'contractorName'>;

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  ordersByStatus: { name: string; value: number; color: string }[];
  revenueByCompany: { name: string; value: number }[];
}