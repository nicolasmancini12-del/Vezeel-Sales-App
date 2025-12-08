
import { Company, Client, Contractor, PriceListEntry, User, WorkflowStatus, ServiceCatalogItem } from './types';

export const ROLES = {
  ADMIN: 'Admin',
  OPERATIONS: 'Operaciones',
  VIEWER: 'Lector'
};

// Available colors for the status editor
export const COLOR_OPTIONS = [
  { label: 'Gris (Neutro)', value: 'bg-gray-100 text-gray-800 border-gray-200' },
  { label: 'Azul (Proceso)', value: 'bg-blue-100 text-blue-800 border-blue-200' },
  { label: 'Morado (QA)', value: 'bg-purple-100 text-purple-800 border-purple-200' },
  { label: 'Indigo (Cliente)', value: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { label: 'Amarillo (Alerta)', value: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { label: 'Esmeralda (Éxito)', value: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { label: 'Verde (Dinero)', value: 'bg-green-100 text-green-800 border-green-200' },
  { label: 'Rojo (Error)', value: 'bg-red-100 text-red-800 border-red-200' },
];

export const DEFAULT_WORKFLOW: WorkflowStatus[] = [
  { id: 'st1', name: 'En Análisis', order: 1, color: COLOR_OPTIONS[0].value },
  { id: 'st2', name: 'En Desarrollo', order: 2, color: COLOR_OPTIONS[1].value },
  { id: 'st3', name: 'QA Interno', order: 3, color: COLOR_OPTIONS[2].value },
  { id: 'st4', name: 'QA Cliente', order: 4, color: COLOR_OPTIONS[3].value },
  { id: 'st5', name: 'A Certificar', order: 5, color: COLOR_OPTIONS[4].value },
  { id: 'st6', name: 'Certificado', order: 6, color: COLOR_OPTIONS[5].value },
  { id: 'st7', name: 'Facturado', order: 7, color: COLOR_OPTIONS[6].value },
];

// Unit of Measures common list
export const UNITS_OF_MEASURE = ['Horas', 'Mza', 'HP', 'Días', 'Proyecto', 'Story Points', 'Licencia'];

// Mock Data - Services Catalog (New)
export const MOCK_SERVICES: ServiceCatalogItem[] = [
    { id: 's1', name: 'Desarrollo Senior Java', category: 'Desarrollo' },
    { id: 's2', name: 'Consultoría SAP MM', category: 'Consultoría' },
    { id: 's3', name: 'Mantenimiento Mensual App', category: 'Soporte' },
    { id: 's4', name: 'Diseño UX/UI', category: 'Diseño' },
    { id: 's5', name: 'DevOps Cloud AWS', category: 'Infraestructura' }
];

// Mock Data - Users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Jane Doe', role: 'Admin', initials: 'JD' },
  { id: 'u2', name: 'Carlos Ruiz', role: 'Operaciones', initials: 'CR' },
  { id: 'u3', name: 'Visitante', role: 'Lector', initials: 'VI' }
];

// Mock Data - Companies
export const MOCK_COMPANIES: Company[] = [
  { id: 'co1', name: 'Tech Solutions S.A.' },
  { id: 'co2', name: 'Innovate Corp' },
  { id: 'co3', name: 'Global Services Ltd' }
];

// Mock Data - Clients
export const MOCK_CLIENTS: Client[] = [
  { id: 'c1', name: 'Banco Futuro', taxId: 'BF-999', contactName: 'Ana Lopez' },
  { id: 'c2', name: 'Retail Giants', taxId: 'RG-888', contactName: 'Pedro Martinez' },
  { id: 'c3', name: 'Logistica Express', taxId: 'LE-777', contactName: 'Sofia Ruiz' }
];

// Mock Data - Contractors
export const MOCK_CONTRACTORS: Contractor[] = [
  { id: 'ct1', name: 'DevSquad External', specialty: 'Desarrollo Web', company: 'Tech Solutions S.A.' },
  { id: 'ct2', name: 'Consultora Expertos', specialty: 'SAP', company: 'Global Services Ltd' },
  { id: 'ct3', name: 'WebCrafters', specialty: 'Diseño UI/UX', company: 'Innovate Corp' },
  { id: 'ct4', name: 'Interno', specialty: 'General', company: 'Tech Solutions S.A.' }
];

// Mock Data - Price List
export const MOCK_PRICE_LIST: PriceListEntry[] = [
  { 
    id: 'p1', 
    serviceName: 'Desarrollo Senior Java', 
    company: 'Tech Solutions S.A.', 
    contractorId: 'ct1', 
    clientId: '', // Generic for all clients
    unitOfMeasure: 'Horas', 
    unitPrice: 85, 
    contractorCost: 50,
    validFrom: '2023-01-01', 
    validTo: '2025-12-31' 
  },
  { 
    id: 'p2', 
    serviceName: 'Consultoría SAP MM', 
    company: 'Global Services Ltd', 
    contractorId: 'ct2', 
    clientId: 'c3', // Specific for Logistica Express
    unitOfMeasure: 'Días', 
    unitPrice: 600, 
    contractorCost: 400,
    validFrom: '2023-01-01', 
    validTo: '2024-12-31' 
  },
  { 
    id: 'p3', 
    serviceName: 'Mantenimiento Mensual App', 
    company: 'Innovate Corp', 
    contractorId: 'ct4', 
    clientId: 'c2', 
    unitOfMeasure: 'Mza', 
    unitPrice: 1500, 
    contractorCost: 0, // Internal
    validFrom: '2023-06-01', 
    validTo: '2024-06-01' 
  }
];

// Seed Data Orders
export const MOCK_ORDERS = [
  {
    id: '1001',
    date: '2023-10-01',
    company: 'Tech Solutions S.A.',
    clientId: 'c1',
    clientName: 'Banco Futuro',
    poNumber: 'OC-9982',
    serviceName: 'Desarrollo Senior Java', // Matched to catalog
    serviceDetails: 'Ticket #JIRA-442 Sprint 12',
    unitOfMeasure: 'Horas',
    quantity: 120,
    unitPrice: 85,
    unitCost: 50,
    totalValue: 10200,
    contractorId: 'ct1',
    contractorName: 'DevSquad External',
    status: 'En Desarrollo',
    operationsRep: 'Carlos Ruiz',
    observations: 'Retraso por acceso a VPN.',
    commitmentDate: '2023-11-15'
  },
  {
    id: '1002',
    date: '2023-10-05',
    company: 'Innovate Corp',
    clientId: 'c2',
    clientName: 'Retail Giants',
    poNumber: 'OC-2211',
    serviceName: 'Mantenimiento Mensual App',
    serviceDetails: '',
    unitOfMeasure: 'Proyecto',
    quantity: 1,
    unitPrice: 15000,
    unitCost: 8000,
    totalValue: 15000,
    contractorId: 'ct4',
    contractorName: 'Interno',
    status: 'QA Cliente',
    operationsRep: 'Maria Gomez',
    observations: 'Esperando feedback de UX.',
    commitmentDate: '2023-12-01',
    clientCertDate: '2023-12-10'
  }
];
