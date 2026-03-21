import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Consultation Model ───────────────────────────────────────────────────────
const ConsultationSchema = new Schema({
  consultationNumber: { type: String, unique: true },

  // Participants
  patientId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId:     { type: Schema.Types.ObjectId, ref: 'User', index: true },
  pharmacistId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  nurseId:      { type: Schema.Types.ObjectId, ref: 'User', index: true },

  // Subscription / access gate
  consultationType: {
    type: String,
    enum: ['doctor', 'pharmacist', 'nurse'],
    required: true,
  },
  planRequired: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    default: 'basic',
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  },

  // Scheduling
  scheduledAt:  Date,
  startedAt:    Date,
  completedAt:  Date,
  durationMins: Number,

  // Session
  channel:     { type: String, enum: ['video', 'audio', 'chat', 'in_person'], default: 'chat' },
  roomId:      String,   // WebRTC / video room ID
  roomToken:   String,   // Secure room token
  meetingLink: String,

  // Medical
  chiefComplaint: String,
  symptoms:       [String],
  bodyParts:      [String],
  severity:       Number,
  vitals: {
    bloodPressure: String,
    heartRate:     Number,
    temperature:   Number,
    oxygenSat:     Number,
    weight:        Number,
  },

  // Notes & outputs
  doctorNotes:    String,
  diagnosis:      String,
  treatment:      String,
  followUpDate:   Date,
  followUpNotes:  String,

  // Prescription issued during consultation
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },

  // Chat messages in the session
  messages: [{
    senderId:  { type: Schema.Types.ObjectId, ref: 'User' },
    senderRole: String,
    content:   String,
    type:      { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    fileUrl:   String,
    sentAt:    { type: Date, default: Date.now },
    isRead:    { type: Boolean, default: false },
  }],

  // Billing
  fee:           { type: Number, default: 0 },
  isPaid:        { type: Boolean, default: false },
  paymentMethod: String,
  paidAt:        Date,

  rating:    { type: Number, min: 1, max: 5 },
  feedback:  String,

  isLocked:  { type: Boolean, default: false }, // consultation locked behind subscription
  tenantId:  { type: Schema.Types.ObjectId, ref: 'Tenant' },
}, { timestamps: true });

ConsultationSchema.pre('save', function (next) {
  if (!this.consultationNumber) {
    this.consultationNumber = 'CONS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  next();
});

ConsultationSchema.index({ patientId: 1, status: 1 });
ConsultationSchema.index({ doctorId: 1, status: 1 });
ConsultationSchema.index({ scheduledAt: 1 });

// ─── DoctorProfile Model ──────────────────────────────────────────────────────
const DoctorProfileSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  licenseNumber:   { type: String, required: true },
  licenseExpiry:   Date,
  specialization:  [String],
  qualifications:  [String],
  experience:      Number, // years
  hospital:        String,
  bio:             String,
  languages:       [String],
  consultationFee: { type: Number, default: 25 },
  availability: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun
    startTime: String, // "09:00"
    endTime:   String, // "17:00"
  }],
  rating:       { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  isVerified:   { type: Boolean, default: false },
  isAvailable:  { type: Boolean, default: true },
  avatar:       String,
}, { timestamps: true });

// ─── SubscriptionPlan Model ───────────────────────────────────────────────────
const SubscriptionSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tenantId:    { type: Schema.Types.ObjectId, ref: 'Tenant' },
  plan:        { type: String, enum: ['basic', 'pro', 'enterprise'], required: true },
  status:      { type: String, enum: ['active', 'expired', 'cancelled', 'trial'], default: 'trial' },
  features: {
    doctorConsultations:     { type: Boolean, default: false },
    pharmacistConsultations: { type: Boolean, default: true },
    nurseConsultations:      { type: Boolean, default: false },
    unlimitedSymptomLogs:    { type: Boolean, default: true },
    aiScanner:               { type: Boolean, default: true },
    prioritySupport:         { type: Boolean, default: false },
    telemedicine:            { type: Boolean, default: false },
    maxConsultationsPerMonth:{ type: Number, default: 3 },
  },
  currentPeriodStart: Date,
  currentPeriodEnd:   Date,
  stripeSubscriptionId: String,
  stripeCustomerId:     String,
  cancelAtPeriodEnd:    { type: Boolean, default: false },
  trialEndsAt:          Date,
}, { timestamps: true });

// ─── Export helpers ───────────────────────────────────────────────────────────
function getModel<T>(name: string, schema: Schema): Model<T & Document> {
  return (mongoose.models[name] || mongoose.model<T & Document>(name, schema)) as Model<T & Document>;
}

export const ConsultationModel  = getModel('Consultation',  ConsultationSchema);
export const DoctorProfileModel = getModel('DoctorProfile', DoctorProfileSchema);
export const SubscriptionModel  = getModel('Subscription',  SubscriptionSchema);

// Plan feature matrix
export const PLAN_FEATURES = {
  basic: {
    doctorConsultations:      false,
    pharmacistConsultations:  true,
    nurseConsultations:       false,
    maxConsultationsPerMonth: 3,
    telemedicine:             false,
    prioritySupport:          false,
  },
  pro: {
    doctorConsultations:      true,
    pharmacistConsultations:  true,
    nurseConsultations:       true,
    maxConsultationsPerMonth: 10,
    telemedicine:             true,
    prioritySupport:          false,
  },
  enterprise: {
    doctorConsultations:      true,
    pharmacistConsultations:  true,
    nurseConsultations:       true,
    maxConsultationsPerMonth: 999,
    telemedicine:             true,
    prioritySupport:          true,
  },
} as const;

export const PLAN_PRICES = { basic: 0, pro: 19.99, enterprise: 49.99 };
