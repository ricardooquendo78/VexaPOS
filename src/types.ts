export type UserRole = "admin" | "worker";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  createdAt: string;
}

export interface BusinessConfig {
  name: string;
  nit: string;
  foundationYear: string;
  phone: string;
  address: string;
  city: string;
  logoUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD
  laboratory: string;
  cost: number; // Cost of 1 unit or 1 box/sobre depending on the base unit
  price: number; // Retail price
  priceUnits?: number; // Retail price for single units when mode is 'ambas'
  category: string;
  
  // Package breakdown configuration
  // E.g., name: "Aspirina", sold by Box (sobre) containing 10 tablets (units).
  quantityOnSkins: number; // How many boxes/sobres in stock
  quantityUnits: number; // How many leftover single units/tablets in stock
  conversionFactor: number; // How many units/tablets make up exactly 1 Box/Sobre (e.g. 10 or 12 or 24)
  
  minStockAlert: number; // Alert threshold in units equivalent
  barcode?: string;
  fotoUrl?: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  companyName: string;
  nit: string;
  phone: string;
  whatsapp: string;
}

export interface CartItem {
  product: Product;
  quantitySkins: number;  // number of boxes/sobres sold
  quantityUnits: number;  // number of loose pills sold
  subtotal: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  dateTime: string;
  sellerId: string;
  sellerName: string;
  items: {
    productId: string;
    productName: string;
    quantitySkins: number;
    quantityUnits: number;
    price: number;
    subtotal: number;
  }[];
  total: number;
  clientNit?: string;
}

export interface RealExpense {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface DailyClosure {
  id: string; // e.g. "2026-06-17"
  date: string;
  totalSalesCount: number;
  totalSalesRevenue: number;
  totalExpenses: number;
  initialCash: number;
  finalCash: number;
  expenses: RealExpense[];
  isClosed: boolean;
  closedAt?: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "SYNC";
  entity: string;
  details: string;
  status: "pending" | "resolved" | "conflict";
}
