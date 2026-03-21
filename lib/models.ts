import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================
// USER MODEL
// ============================================================
const UserSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'tenant_admin', 'pharmacist', 'cashier', 'inventory_manager', 'driver', 'consumer', 'doctor'],
    default: 'consumer',
  },
  phone: String,
  avatar: String,
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  healthProfile: {
    dateOfBirth: Date,
    bloodType: String,
    allergies: [String],
    conditions: [String],
    currentMedications: [String],
    weight: Number,
    height: Number,
    emergencyContact: {
      name: String,
      phone: String,
      email: String,
    },
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number },
  },
  lastLoginAt: Date,
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ tenantId: 1, role: 1 });

// ============================================================
// TENANT MODEL
// ============================================================
const TenantSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['wholesaler', 'retailer', 'admin'], required: true },
  subdomain: { type: String, unique: true, lowercase: true },
  plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
  licenseNumber: String,
  address: {
    street: String, city: String, state: String,
    country: String, zipCode: String,
    coordinates: { lat: Number, lng: Number },
  },
  contact: { name: String, email: String, phone: String },
  settings: {
    theme: { type: String, default: 'light' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    enableDelivery: { type: Boolean, default: true },
    enablePrescriptions: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0 },
    logo: String,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ============================================================
// DRUG MODEL
// ============================================================
const DrugSchema = new Schema({
  name: { type: String, required: true, index: true },
  genericName: String,
  brand: String,
  manufacturer: String,
  category: [String],
  description: String,
  symptoms: [String],
  indications: [String],
  contraindications: [String],
  sideEffects: [String],
  interactions: [{
    drugName: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe', 'contraindicated'] },
    description: String,
  }],
  dosage: [{
    ageGroup: String,
    minAge: Number,
    maxAge: Number,
    dose: String,
    frequency: String,
    route: String,
    maxDailyDose: String,
    notes: String,
  }],
  requiresPrescription: { type: Boolean, default: false },
  isControlled: { type: Boolean, default: false },
  controlledSchedule: String,
  images: [{
    publicId: String,
    url: String,
    secureUrl: String,
    format: String,
    width: Number,
    height: Number,
  }],
  barcode: String,
  sku: { type: String, unique: true },
  activeIngredients: [String],
  strength: String,
  form: {
    type: String,
    enum: ['tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'patch', 'drops'],
  },
  storageInstructions: String,
  embedding: [Number],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

DrugSchema.index({ name: 'text', genericName: 'text', symptoms: 'text' });
DrugSchema.index({ symptoms: 1 });
DrugSchema.index({ category: 1 });

// ============================================================
// INVENTORY MODEL
// ============================================================
const InventorySchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  drugId: { type: Schema.Types.ObjectId, ref: 'Drug', required: true },
  quantity: { type: Number, default: 0, min: 0 },
  reservedQuantity: { type: Number, default: 0 },
  batchNumber: { type: String, required: true },
  lotNumber: String,
  expiryDate: { type: Date, required: true },
  manufacturingDate: Date,
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  wholesalePrice: Number,
  reorderLevel: { type: Number, default: 10 },
  maxLevel: { type: Number, default: 500 },
  location: String,
  supplierId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
}, { timestamps: true });

InventorySchema.index({ tenantId: 1, drugId: 1 });
InventorySchema.index({ expiryDate: 1 });
InventorySchema.virtual('isExpired').get(function () {
  return this.expiryDate < new Date();
});
InventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderLevel;
});

// ============================================================
// ORDER MODEL
// ============================================================
const OrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: { type: String, enum: ['consumer_to_retailer', 'retailer_to_wholesaler', 'pos'] },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  items: [{
    drugId: { type: Schema.Types.ObjectId, ref: 'Drug' },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: Number,
    batchNumber: String,
  }],
  status: {
    type: String,
    enum: ['pending','confirmed','processing','packed','dispatched','out_for_delivery','delivered','cancelled','refunded','returned'],
    default: 'pending',
  },
  payment: {
    method: { type: String, enum: ['cash','card','bank_transfer','mobile_money','credit'] },
    status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
    transactionId: String,
    paidAt: Date,
    receiptUrl: String,
  },
  delivery: {
    address: { street: String, city: String, state: String, country: String, zipCode: String },
    method: String,
    scheduledAt: Date,
    deliveredAt: Date,
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    trackingCode: String,
    currentLocation: { lat: Number, lng: Number },
    proofOfDelivery: String,
  },
  prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: String,
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: String,
  }],
}, { timestamps: true });

OrderSchema.index({ tenantId: 1, status: 1 });
OrderSchema.index({ buyerId: 1 });
OrderSchema.index({ orderNumber: 1 });

// Pre-save: generate order number
OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  next();
});

// ============================================================
// PRESCRIPTION MODEL
// ============================================================
const PrescriptionSchema = new Schema({
  prescriptionNumber: { type: String, unique: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  doctorName: { type: String, required: true },
  doctorLicense: String,
  hospitalName: String,
  drugs: [{
    drugId: { type: Schema.Types.ObjectId, ref: 'Drug' },
    drugName: { type: String, required: true },
    genericName: String,
    strength: String,
    form: String,
    dosage: String,
    frequency: String,
    duration: String,
    quantity: { type: Number, required: true },
    instructions: String,
    isDispensed: { type: Boolean, default: false },
    dispensedAt: Date,
    dispensedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  imageUrl: String,
  imagePublicId: String,
  diagnosis: String,
  notes: String,
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  isActive: { type: Boolean, default: true },
  refillsAllowed: { type: Number, default: 0 },
  refillsUsed: { type: Number, default: 0 },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

PrescriptionSchema.pre('save', function (next) {
  if (!this.prescriptionNumber) {
    this.prescriptionNumber = 'RX-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

// ============================================================
// SYMPTOM LOG MODEL
// ============================================================
const SymptomLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bodyParts: [String],
  symptoms: [String],
  severity: { type: Number, min: 1, max: 10 },
  duration: String,
  description: String,
  aiRecommendations: [{
    drugName: String,
    genericName: String,
    indication: String,
    dosage: String,
    frequency: String,
    duration: String,
    isOTC: Boolean,
    requiresPrescription: Boolean,
    warnings: [String],
    confidence: Number,
  }],
  visitedPharmacy: { type: Boolean, default: false },
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  isResolved: { type: Boolean, default: false },
  resolvedAt: Date,
  loggedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// ============================================================
// DELIVERY MODEL
// ============================================================
const DeliverySchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
    default: 'pending',
  },
  pickupAddress: { street: String, city: String, state: String, country: String, zipCode: String },
  deliveryAddress: { street: String, city: String, state: String, country: String, zipCode: String },
  currentLocation: { lat: Number, lng: Number },
  route: [{ lat: Number, lng: Number, timestamp: Date, speed: Number }],
  estimatedDelivery: Date,
  actualDelivery: Date,
  proofOfDelivery: String,
  temperature: [{ value: Number, recordedAt: Date, isAlert: Boolean }],
  notes: String,
}, { timestamps: true });

// ============================================================
// TRANSACTION MODEL
// ============================================================
const TransactionSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  type: { type: String, enum: ['sale','purchase','refund','expense','payment_received','payment_sent'] },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  description: String,
  category: String,
  reference: String,
  balanceBefore: Number,
  balanceAfter: Number,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ============================================================
// NOTIFICATION MODEL
// ============================================================
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  type: { type: String, enum: ['order','delivery','prescription','low_stock','expiry','system','ai'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// ============================================================
// AUDIT LOG MODEL
// ============================================================
const AuditLogSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId },
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

// ============================================================
// EXPORT MODELS
// ============================================================
function getModel<T>(name: string, schema: Schema): Model<T & Document> {
  return (mongoose.models[name] || mongoose.model<T & Document>(name, schema)) as Model<T & Document>;
}

export const UserModel = getModel('User', UserSchema);
export const TenantModel = getModel('Tenant', TenantSchema);
export const DrugModel = getModel('Drug', DrugSchema);
export const InventoryModel = getModel('Inventory', InventorySchema);
export const OrderModel = getModel('Order', OrderSchema);
export const PrescriptionModel = getModel('Prescription', PrescriptionSchema);
export const SymptomLogModel = getModel('SymptomLog', SymptomLogSchema);
export const DeliveryModel = getModel('Delivery', DeliverySchema);
export const TransactionModel = getModel('Transaction', TransactionSchema);
export const NotificationModel = getModel('Notification', NotificationSchema);
export const AuditLogModel = getModel('AuditLog', AuditLogSchema);
