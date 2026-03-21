// ============================================
// PharmaConnect — Core Type Definitions
// ============================================

// ---- Tenant & User ----

export type TenantType = 'wholesaler' | 'retailer' | 'admin';

export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'pharmacist'
  | 'cashier'
  | 'inventory_manager'
  | 'driver'
  | 'consumer'
  | 'doctor';

export interface Tenant {
  _id: string;
  name: string;
  type: TenantType;
  subdomain: string;
  plan: 'starter' | 'professional' | 'enterprise';
  licenseNumber: string;
  address: Address;
  contact: ContactInfo;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  timezone: string;
  enableDelivery: boolean;
  enablePrescriptions: boolean;
  taxRate: number;
  logo?: string;
}

export interface User {
  _id: string;
  tenantId?: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  healthProfile?: HealthProfile;
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface HealthProfile {
  dateOfBirth?: Date;
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  currentMedications: string[];
  weight?: number;
  height?: number;
  emergencyContact?: ContactInfo;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: { lat: number; lng: number };
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone: string;
}

// ---- Drug / Medication ----

export type DrugCategory =
  | 'analgesic'
  | 'antibiotic'
  | 'antiviral'
  | 'antifungal'
  | 'antihistamine'
  | 'antihypertensive'
  | 'antidiabetic'
  | 'cardiovascular'
  | 'gastrointestinal'
  | 'respiratory'
  | 'neurological'
  | 'psychiatric'
  | 'hormone'
  | 'vitamin'
  | 'supplement'
  | 'topical'
  | 'ophthalmic'
  | 'vaccine'
  | 'other';

export interface Drug {
  _id: string;
  name: string;
  genericName: string;
  brand: string;
  manufacturer: string;
  category: DrugCategory[];
  description: string;
  symptoms: string[];
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  interactions: DrugInteraction[];
  dosage: DosageInfo[];
  requiresPrescription: boolean;
  isControlled: boolean;
  controlledSchedule?: string;
  images: CloudinaryImage[];
  barcode?: string;
  sku: string;
  activeIngredients: string[];
  strength: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'inhaler' | 'patch' | 'drops';
  storageInstructions: string;
  embedding?: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrugInteraction {
  drugName: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
}

export interface DosageInfo {
  ageGroup: 'pediatric' | 'adult' | 'elderly';
  minAge?: number;
  maxAge?: number;
  dose: string;
  frequency: string;
  route: string;
  maxDailyDose?: string;
  notes?: string;
}

export interface CloudinaryImage {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
}

// ---- Inventory ----

export interface InventoryItem {
  _id: string;
  tenantId: string;
  drugId: string;
  drug?: Drug;
  quantity: number;
  reservedQuantity: number;
  batchNumber: string;
  lotNumber?: string;
  expiryDate: Date;
  manufacturingDate?: Date;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  reorderLevel: number;
  maxLevel: number;
  location?: string;
  supplierId?: string;
  isExpired?: boolean;
  isLowStock?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Orders ----

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned';

export type OrderType = 'consumer_to_retailer' | 'retailer_to_wholesaler' | 'pos';

export interface Order {
  _id: string;
  orderNumber: string;
  tenantId: string;
  type: OrderType;
  buyerId: string;
  buyer?: User;
  sellerId: string;
  seller?: Tenant;
  items: OrderItem[];
  status: OrderStatus;
  payment: PaymentInfo;
  delivery?: DeliveryInfo;
  prescription?: string;
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  statusHistory: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  drugId: string;
  drug?: Drug;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  batchNumber: string;
}

export interface PaymentInfo {
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'credit';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
  receiptUrl?: string;
}

export interface DeliveryInfo {
  address: Address;
  method: 'standard' | 'express' | 'same_day' | 'pickup';
  scheduledAt?: Date;
  deliveredAt?: Date;
  driverId?: string;
  driver?: User;
  trackingCode: string;
  currentLocation?: { lat: number; lng: number };
  proofOfDelivery?: string;
  temperature?: number[];
}

export interface StatusChange {
  status: OrderStatus;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

// ---- Prescriptions ----

export interface Prescription {
  _id: string;
  prescriptionNumber: string;
  patientId: string;
  patient?: User;
  tenantId?: string;
  doctorName: string;
  doctorLicense: string;
  hospitalName?: string;
  drugs: PrescribedDrug[];
  imageUrl?: string;
  imagePublicId?: string;
  diagnosis?: string;
  notes?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  isActive: boolean;
  refillsAllowed: number;
  refillsUsed: number;
  issuedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface PrescribedDrug {
  drugId?: string;
  drugName: string;
  genericName?: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  isDispensed: boolean;
  dispensedAt?: Date;
  dispensedBy?: string;
}

// ---- Symptom Logs ----

export interface SymptomLog {
  _id: string;
  userId: string;
  bodyParts: BodyPart[];
  symptoms: string[];
  severity: number;
  duration?: string;
  description?: string;
  aiRecommendations: AIRecommendation[];
  visitedPharmacy?: boolean;
  pharmacyId?: string;
  prescriptionId?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  loggedAt: Date;
}

export type BodyPart =
  | 'head'
  | 'neck'
  | 'chest'
  | 'upper_back'
  | 'lower_back'
  | 'abdomen'
  | 'left_arm'
  | 'right_arm'
  | 'left_hand'
  | 'right_hand'
  | 'left_leg'
  | 'right_leg'
  | 'left_foot'
  | 'right_foot'
  | 'pelvis'
  | 'skin'
  | 'eyes'
  | 'ears'
  | 'nose'
  | 'throat';

export interface AIRecommendation {
  drugName: string;
  genericName: string;
  indication: string;
  dosage: string;
  frequency: string;
  duration: string;
  isOTC: boolean;
  requiresPrescription: boolean;
  warnings: string[];
  confidence: number;
}

// ---- Delivery ----

export interface Delivery {
  _id: string;
  orderId: string;
  order?: Order;
  tenantId: string;
  driverId?: string;
  driver?: User;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  pickupAddress: Address;
  deliveryAddress: Address;
  currentLocation?: { lat: number; lng: number };
  route: RoutePoint[];
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  proofOfDelivery?: string;
  temperature?: TemperatureLog[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
}

export interface TemperatureLog {
  value: number;
  recordedAt: Date;
  isAlert: boolean;
}

// ---- Accounting ----

export interface Transaction {
  _id: string;
  tenantId: string;
  type: 'sale' | 'purchase' | 'refund' | 'expense' | 'payment_received' | 'payment_sent';
  orderId?: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  reference?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdBy: string;
  createdAt: Date;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  tenantId: string;
  orderId: string;
  order?: Order;
  issuedTo: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  pdfUrl?: string;
  createdAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ---- Analytics ----

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topDrugs: TopItem[];
  revenueByDay: ChartDataPoint[];
  ordersByStatus: ChartDataPoint[];
  inventoryAlerts: number;
  lowStockItems: number;
  expiringSoon: number;
}

export interface TopItem {
  id: string;
  name: string;
  value: number;
  change: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

// ---- Notifications ----

export interface Notification {
  _id: string;
  userId: string;
  tenantId?: string;
  type: 'order' | 'delivery' | 'prescription' | 'low_stock' | 'expiry' | 'system' | 'ai';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ---- Audit Log ----

export interface AuditLog {
  _id: string;
  tenantId?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ---- API Response ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
