# WhatsApp AI Integration Architecture - Fyness SaaS Platform

## 📱 Overview

The Fyness platform is designed as a **SaaS financial management system** that allows users to manage their finances through:
1. **Manual entry** via web interface
2. **AI-powered entry** via WhatsApp messages

This document outlines the complete architecture for WhatsApp AI integration.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Fyness SaaS Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │   Web App    │              │  WhatsApp    │                 │
│  │   (Manual)   │              │     API      │                 │
│  └──────┬───────┘              └──────┬───────┘                 │
│         │                             │                          │
│         ├─────────────┬───────────────┤                          │
│         │             │               │                          │
│         ▼             ▼               ▼                          │
│  ┌──────────────────────────────────────────┐                   │
│  │         Business Logic Layer             │                   │
│  ├──────────────────────────────────────────┤                   │
│  │  • Transaction Service                   │                   │
│  │  • Contact Service                       │                   │
│  │  • AI Processing Service                 │                   │
│  │  • Validation Service                    │                   │
│  └──────────────┬───────────────────────────┘                   │
│                 │                                                │
│                 ▼                                                │
│  ┌──────────────────────────────────────────┐                   │
│  │         Database (Prisma + SQLite)       │                   │
│  │  • Conta (Transactions)                  │                   │
│  │  • Pessoa (Contacts)                     │                   │
│  │  • User (Authentication)                 │                   │
│  │  • WhatsAppMessage (Message History)     │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Message Processing Flow

### 1. WhatsApp Message Reception

```
User sends message via WhatsApp
         ↓
WhatsApp Business API receives message
         ↓
Webhook POST to /api/whatsapp/webhook
         ↓
Extract message content and metadata
         ↓
Queue message for AI processing
```

### 2. AI Processing Pipeline

```
Message → NLP Analysis → Entity Extraction → Validation → Database Insert
```

**Example Messages:**

```
"Paguei R$ 500 para a Eletropaulo hoje"
   ↓
Extracted:
   - Type: "pagar" (payment)
   - Amount: 500
   - Beneficiary: "Eletropaulo"
   - Date: Today
   - Status: "pago" (paid)

"Vou receber R$ 1.200 do cliente João dia 25/02"
   ↓
Extracted:
   - Type: "receber" (receivable)
   - Amount: 1200
   - Client: "João"
   - Due Date: 2026-02-25
   - Status: "pendente" (pending)

"Conta de R$ 300 vence amanhã - fornecedor XYZ"
   ↓
Extracted:
   - Type: "pagar"
   - Amount: 300
   - Beneficiary: "fornecedor XYZ"
   - Due Date: Tomorrow
   - Status: "pendente"
```

### 3. Entity Extraction Rules

The AI should extract:

| Entity | Examples | Required |
|--------|----------|----------|
| **Amount** | R$ 500, 1.200, mil reais | ✅ Yes |
| **Type** | pagar, receber, paguei, recebi | ✅ Yes |
| **Beneficiary/Client** | Eletropaulo, João, Fornecedor XYZ | ✅ Yes |
| **Date** | hoje, amanhã, 25/02, próxima segunda | ✅ Yes |
| **Status** | paguei (pago), vou pagar (pendente) | ✅ Yes |
| **Category** | água, luz, salário, venda | ❌ Optional |
| **Payment Method** | PIX, boleto, dinheiro | ❌ Optional |
| **Description** | Additional context | ❌ Optional |

---

## 📁 Database Schema Updates

### New Model: WhatsAppMessage

```prisma
model WhatsAppMessage {
  id              String   @id @default(cuid())
  phoneNumber     String   // User's WhatsApp number
  message         String   // Original message
  processedAt     DateTime @default(now())

  // AI Processing Results
  aiConfidence    Float?   // 0-1 confidence score
  extractedData   Json?    // Extracted entities

  // Status
  status          String   // "pending", "processed", "failed", "needs_confirmation"
  errorMessage    String?

  // Link to created transaction
  contaId         Int?
  conta           Conta?   @relation(fields: [contaId], references: [id])

  // User confirmation
  confirmed       Boolean  @default(false)
  confirmationDate DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Update Conta Model

```prisma
model Conta {
  // ... existing fields ...

  // AI Integration
  createdViaWhatsApp Boolean @default(false)
  aiConfidence       Float?
  whatsappMessages   WhatsAppMessage[]

  // ... rest of fields ...
}
```

---

## 🛠️ API Endpoints

### 1. WhatsApp Webhook Endpoint

**POST** `/api/whatsapp/webhook`

```typescript
// Receives messages from WhatsApp Business API
interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages: Array<{
          from: string;        // Phone number
          id: string;          // Message ID
          timestamp: string;
          type: 'text' | 'image' | 'document';
          text?: {
            body: string;      // Message content
          };
        }>;
      };
    }>;
  }>;
}
```

**Response:** 200 OK (always, to acknowledge receipt)

### 2. AI Processing Endpoint

**POST** `/api/ai/process-message`

```typescript
interface ProcessMessageRequest {
  messageId: string;
  phoneNumber: string;
  messageContent: string;
  userId: string;  // Authenticated user
}

interface ProcessMessageResponse {
  success: boolean;
  confidence: number;  // 0-1
  extractedData: {
    tipo: 'pagar' | 'receber';
    valor: number;
    descricao: string;
    vencimento: string;  // ISO date
    status: 'pago' | 'pendente' | 'vencido';
    beneficiario?: string;
    categoria?: string;
    formaPagamento?: string;
  };
  needsConfirmation: boolean;
  confirmationMessage: string;  // Message to send back to user
}
```

### 3. Confirmation Endpoint

**POST** `/api/whatsapp/confirm`

```typescript
interface ConfirmRequest {
  messageId: string;
  confirmed: boolean;
  corrections?: Partial<ContaFormData>;
}

interface ConfirmResponse {
  success: boolean;
  contaId?: number;
  message: string;
}
```

---

## 🔄 User Interaction Flow

### Scenario 1: High Confidence Transaction

```
User: "Paguei R$ 500 para Eletropaulo hoje"
  ↓
AI processes (confidence: 0.95)
  ↓
Bot: "✅ Registrado: Pagamento de R$ 500,00 para Eletropaulo em 21/01/2026"
  ↓
Transaction automatically saved
```

### Scenario 2: Low Confidence - Needs Confirmation

```
User: "Paguei aquela conta de luz"
  ↓
AI processes (confidence: 0.45)
  ↓
Bot: "❓ Preciso de mais informações:
      - Qual o valor pago?
      - Qual a data do pagamento?"
  ↓
User: "R$ 500 hoje"
  ↓
Bot: "✅ Confirmado: Pagamento de R$ 500,00 para conta de luz em 21/01/2026
      Está correto? (Sim/Não)"
  ↓
User: "Sim"
  ↓
Transaction saved
```

### Scenario 3: Ambiguous Transaction

```
User: "Recebi 1200"
  ↓
AI processes (confidence: 0.60)
  ↓
Bot: "📝 Você recebeu R$ 1.200,00
      - De quem você recebeu?
      - Qual a descrição?"
  ↓
User: "Do cliente João - venda de produtos"
  ↓
Bot: "✅ Registrado: Recebimento de R$ 1.200,00 do cliente João
      Descrição: venda de produtos
      Data: 21/01/2026"
```

---

## 🧠 AI Service Implementation

### Natural Language Processing (NLP)

**Recommended Approach:**

1. **Option A: OpenAI GPT-4** (Recommended for MVP)
   - Easy integration
   - High accuracy
   - Structured output with JSON mode
   - Cost: ~$0.01 per message

2. **Option B: Google Gemini**
   - Good accuracy
   - Lower cost
   - Good for Portuguese

3. **Option C: Custom ML Model**
   - Self-hosted
   - Full control
   - More complex setup

### AI Prompt Template

```typescript
const EXTRACTION_PROMPT = `
Você é um assistente financeiro que extrai informações de mensagens do WhatsApp.

Analise a seguinte mensagem e extraia as informações financeiras:

Mensagem: "${message}"

Retorne um JSON com os seguintes campos:
{
  "tipo": "pagar" ou "receber",
  "valor": valor numérico,
  "descricao": descrição curta,
  "beneficiario_ou_cliente": nome da pessoa/empresa,
  "data_vencimento": data no formato ISO (YYYY-MM-DD),
  "status": "pago", "pendente" ou "vencido",
  "categoria": categoria opcional,
  "forma_pagamento": forma de pagamento opcional,
  "confidence": nível de confiança (0-1)
}

Regras:
- Se o usuário diz "paguei", "pago", status é "pago"
- Se diz "vou pagar", "a pagar", status é "pendente"
- "hoje" = data atual
- "amanhã" = data atual + 1 dia
- Se faltam informações, confidence deve ser < 0.7
`;
```

---

## 🔐 Security & Authentication

### User Verification

1. **Phone Number Registration**
   - Users must register their WhatsApp number in the web app
   - Number linked to user account

2. **Two-Factor Verification**
   - First message: Send verification code
   - User confirms in web app
   - Subsequent messages: Authenticated

3. **Rate Limiting**
   - Max 50 messages per user per day
   - Prevent spam/abuse

### Data Privacy

- All messages encrypted in transit
- Message history stored with user consent only
- Users can delete message history
- LGPD (Brazilian GDPR) compliant

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **AI Performance**
   - Average confidence score
   - Confirmation rate
   - Error rate
   - Processing time

2. **User Engagement**
   - Messages per user per day
   - Manual entries vs AI entries
   - Feature adoption rate

3. **Business Metrics**
   - Transactions created via WhatsApp
   - Time saved vs manual entry
   - User retention

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up WhatsApp Business API account
- [ ] Create webhook endpoint
- [ ] Implement basic message reception
- [ ] Set up message queue

### Phase 2: AI Integration (Week 3-4)
- [ ] Integrate OpenAI API
- [ ] Build extraction prompt
- [ ] Implement entity extraction
- [ ] Add confidence scoring

### Phase 3: Transaction Creation (Week 5-6)
- [ ] Build transaction validation
- [ ] Implement auto-save for high confidence
- [ ] Create confirmation flow
- [ ] Add user feedback loop

### Phase 4: Enhancement (Week 7-8)
- [ ] Add support for images (receipts, invoices)
- [ ] Implement bulk operations
- [ ] Add transaction search via WhatsApp
- [ ] Build reporting via WhatsApp

### Phase 5: Production (Week 9-10)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Production deployment

---

## 💡 Advanced Features (Future)

### 1. Receipt OCR
- User sends photo of receipt
- AI extracts amount, vendor, date
- Auto-creates transaction

### 2. Voice Messages
- User sends voice message
- Speech-to-text conversion
- Same AI processing as text

### 3. Recurring Transactions
```
User: "Registrar conta de luz de R$ 500 todo dia 10"
Bot: "✅ Criado: Conta recorrente mensal"
```

### 4. Reminders
```
Bot: "⏰ Lembrete: Você tem 3 contas vencendo amanhã
     - Eletropaulo: R$ 500
     - Internet: R$ 200
     - Água: R$ 150"
```

### 5. Financial Reports
```
User: "Relatório do mês"
Bot: "📊 Resumo de Janeiro/2026:
     💰 Recebido: R$ 10.500
     💸 Pago: R$ 7.800
     📈 Saldo: +R$ 2.700"
```

---

## 🧪 Testing Strategy

### 1. Unit Tests
- AI extraction accuracy
- Validation logic
- Database operations

### 2. Integration Tests
- Webhook → AI → Database flow
- Confirmation flow
- Error handling

### 3. User Acceptance Tests
- Real user messages
- Edge cases
- Multi-language support (PT-BR slang)

---

## 📚 Example Code Structures

### AI Service

```typescript
// lib/services/ai.service.ts
export class AIService {
  async extractFinancialData(message: string): Promise<AIExtractionResult> {
    // Call OpenAI API
    // Parse response
    // Return structured data
  }

  async validateExtraction(data: AIExtractionResult): Promise<ValidationResult> {
    // Validate required fields
    // Check confidence threshold
    // Return validation status
  }

  calculateConfidence(data: AIExtractionResult): number {
    // Scoring algorithm
    // Return 0-1 confidence
  }
}
```

### WhatsApp Service

```typescript
// lib/services/whatsapp.service.ts
export class WhatsAppService {
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    // Send via WhatsApp Business API
  }

  async sendConfirmationRequest(data: ContaFormData): Promise<void> {
    // Format confirmation message
    // Send to user
  }

  async handleIncomingMessage(payload: WhatsAppWebhookPayload): Promise<void> {
    // Extract message
    // Queue for processing
    // Send acknowledgment
  }
}
```

---

## 🎯 Success Criteria

1. **Accuracy**: 95%+ transactions created correctly
2. **Speed**: <5 seconds from message to confirmation
3. **User Satisfaction**: 4.5/5 stars or higher
4. **Adoption**: 60%+ of active users use WhatsApp feature
5. **Reliability**: 99.9% uptime

---

## 📞 Support & Fallback

### Fallback Mechanisms
1. If AI fails → Ask for manual confirmation
2. If confidence < 0.7 → Request more information
3. If invalid data → Clear error message with examples

### User Support
```
User: "Ajuda"
Bot: "📱 Comandos disponíveis:
     • 'Nova conta' - Registrar despesa
     • 'Recebi' - Registrar recebimento
     • 'Saldo' - Ver saldo atual
     • 'Relatório' - Ver resumo financeiro
     • 'Ajuda' - Ver esta mensagem"
```

---

This architecture provides a complete foundation for integrating WhatsApp AI into the Fyness platform, enabling users to manage their finances conversationally while maintaining data accuracy and security.
