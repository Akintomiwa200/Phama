import Anthropic from '@anthropic-ai/sdk';
import type { AIRecommendation } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// DRUG RECOMMENDATION
// ============================================================
export async function getDrugRecommendations(params: {
  bodyParts: string[];
  symptoms: string[];
  severity: number;
  patientAge?: number;
  patientWeight?: number;
  allergies?: string[];
  conditions?: string[];
  currentMedications?: string[];
}): Promise<AIRecommendation[]> {
  const prompt = `You are a pharmaceutical AI assistant. Analyze the following patient symptoms and recommend appropriate medications.

Patient Information:
- Affected body areas: ${params.bodyParts.join(', ')}
- Symptoms: ${params.symptoms.join(', ')}
- Severity (1-10): ${params.severity}
- Age: ${params.patientAge ?? 'Not specified'}
- Weight: ${params.patientWeight ? `${params.patientWeight}kg` : 'Not specified'}
- Known allergies: ${params.allergies?.join(', ') || 'None'}
- Pre-existing conditions: ${params.conditions?.join(', ') || 'None'}
- Current medications: ${params.currentMedications?.join(', ') || 'None'}

Return ONLY a valid JSON array (no markdown, no explanation) with up to 5 drug recommendations:
[
  {
    "drugName": "Brand name",
    "genericName": "Generic/INN name",
    "indication": "Why this drug for this symptom",
    "dosage": "e.g. 500mg",
    "frequency": "e.g. Every 8 hours",
    "duration": "e.g. 5-7 days",
    "isOTC": true/false,
    "requiresPrescription": true/false,
    "warnings": ["warning1", "warning2"],
    "confidence": 0.0-1.0
  }
]

IMPORTANT: 
- Flag drug interactions with current medications
- Note contraindications with known conditions
- Always recommend consulting a pharmacist/doctor
- Be conservative with controlled substances`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  try {
    const raw = content.text.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(raw) as AIRecommendation[];
  } catch {
    return [];
  }
}

// ============================================================
// DRUG SCANNER
// ============================================================
export interface DrugScanResult {
  name: string;
  genericName: string;
  manufacturer: string;
  strength: string;
  form: string;
  indications: string[];
  dosage: DosageGuide[];
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  requiresPrescription: boolean;
  storageInstructions: string;
  expiryInfo?: string;
  isSuspicious: boolean;
  suspicionReason?: string;
}

interface DosageGuide {
  group: string;
  dose: string;
  frequency: string;
}

export async function scanDrugFromText(ocrText: string): Promise<DrugScanResult | null> {
  if (!ocrText || ocrText.trim().length < 10) return null;

  const prompt = `You are a pharmaceutical AI. Analyze this text extracted from a drug packaging/label via OCR and extract structured information.

OCR Text:
"${ocrText}"

Return ONLY valid JSON (no markdown) matching this exact structure:
{
  "name": "Brand name",
  "genericName": "Generic/INN name",
  "manufacturer": "Manufacturer",
  "strength": "Dose strength e.g. 500mg",
  "form": "tablet/capsule/liquid/etc",
  "indications": ["condition1", "condition2"],
  "dosage": [
    { "group": "Adults", "dose": "500mg", "frequency": "every 8 hours" },
    { "group": "Children", "dose": "250mg", "frequency": "every 12 hours" }
  ],
  "sideEffects": ["effect1", "effect2"],
  "warnings": ["warning1"],
  "interactions": ["drug1", "drug2"],
  "requiresPrescription": false,
  "storageInstructions": "Store below 25°C",
  "expiryInfo": "extracted expiry if visible",
  "isSuspicious": false,
  "suspicionReason": null
}

Set isSuspicious=true if text contains suspicious patterns, incomplete info, or possible counterfeit indicators.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return null;

  try {
    const raw = content.text.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(raw) as DrugScanResult;
  } catch {
    return null;
  }
}

export async function scanDrugFromImage(imageBase64: string): Promise<DrugScanResult | null> {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this drug/medicine packaging image and extract all pharmaceutical information.
Return ONLY valid JSON matching this structure:
{
  "name": "Brand name",
  "genericName": "INN name", 
  "manufacturer": "...",
  "strength": "...",
  "form": "tablet/capsule/etc",
  "indications": [...],
  "dosage": [{"group":"Adults","dose":"...","frequency":"..."}],
  "sideEffects": [...],
  "warnings": [...],
  "interactions": [...],
  "requiresPrescription": false,
  "storageInstructions": "...",
  "expiryInfo": "...",
  "isSuspicious": false,
  "suspicionReason": null
}`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return null;

  try {
    const raw = content.text.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(raw) as DrugScanResult;
  } catch {
    return null;
  }
}

// ============================================================
// AI PHARMACIST CHAT
// ============================================================
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithPharmacist(
  messages: ChatMessage[],
  patientProfile?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
  }
): Promise<string> {
  const systemPrompt = `You are an AI pharmaceutical assistant for PharmaConnect. You provide helpful, accurate pharmaceutical information.

${patientProfile ? `Patient Profile:
- Allergies: ${patientProfile.allergies?.join(', ') || 'None known'}
- Conditions: ${patientProfile.conditions?.join(', ') || 'None known'}  
- Current medications: ${patientProfile.medications?.join(', ') || 'None known'}` : ''}

Guidelines:
- Provide helpful drug information, dosage guidance, and drug interaction checks
- Always recommend consulting a licensed pharmacist or doctor for medical advice
- Flag serious drug interactions or contraindications clearly
- Be clear about OTC vs prescription requirements
- Never diagnose conditions — only provide pharmaceutical information
- Keep responses concise and professional`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : 'I apologize, I could not process your request.';
}

// ============================================================
// PREDICTIVE ANALYTICS
// ============================================================
export async function generateDemandForecast(data: {
  symptomTrends: Array<{ symptom: string; count: number; date: string }>;
  currentInventory: Array<{ drug: string; quantity: number }>;
  region?: string;
}): Promise<Array<{ drug: string; predictedDemand: number; restockRecommendation: string; urgency: 'low' | 'medium' | 'high' }>> {
  const prompt = `Analyze pharmaceutical demand patterns and generate restock recommendations.

Symptom trends (last 30 days):
${JSON.stringify(data.symptomTrends.slice(0, 20))}

Current inventory levels:
${JSON.stringify(data.currentInventory.slice(0, 20))}

Region: ${data.region || 'Not specified'}

Return ONLY JSON array:
[{"drug":"DrugName","predictedDemand":100,"restockRecommendation":"Order 500 units","urgency":"medium"}]`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  try {
    const raw = content.text.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default client;
