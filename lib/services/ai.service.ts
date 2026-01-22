/**
 * AI Service for Financial Message Processing
 * Uses OpenAI GPT-4 to extract financial data from natural language
 */

export interface AIExtractionResult {
  tipo: 'pagar' | 'receber';
  valor: number;
  descricao: string;
  beneficiario?: string;
  vencimento: string; // ISO date format
  status: 'pago' | 'pendente' | 'vencido';
  categoria?: string;
  formaPagamento?: string;
  confidence: number; // 0-1
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  needsConfirmation: boolean;
  missingFields: string[];
}

export class AIService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = 'gpt-4-turbo-preview'; // or 'gpt-3.5-turbo' for lower cost
  }

  /**
   * Extract financial data from a natural language message
   */
  async extractFinancialData(message: string, currentDate: Date = new Date()): Promise<AIExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(message, currentDate);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente financeiro especializado em extrair informações de mensagens em português brasileiro.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for more consistent extractions
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const extracted = JSON.parse(content);

      // Validate and normalize the extracted data
      return this.normalizeExtractedData(extracted, currentDate);
    } catch (error) {
      console.error('AI extraction failed:', error);

      // Return fallback with low confidence
      return {
        tipo: 'pagar',
        valor: 0,
        descricao: message.substring(0, 100),
        vencimento: currentDate.toISOString(),
        status: 'pendente',
        confidence: 0,
      };
    }
  }

  /**
   * Build the extraction prompt for OpenAI
   */
  private buildExtractionPrompt(message: string, currentDate: Date): string {
    const dateStr = currentDate.toLocaleDateString('pt-BR');

    return `
Analise a seguinte mensagem financeira e extraia as informações:

Mensagem: "${message}"
Data atual: ${dateStr}

Retorne um JSON com os seguintes campos:
{
  "tipo": "pagar" ou "receber" (obrigatório),
  "valor": valor numérico sem formatação (obrigatório),
  "descricao": descrição curta do que é a transação (obrigatório),
  "beneficiario": nome da pessoa/empresa (se mencionado),
  "vencimento": data no formato ISO YYYY-MM-DD (obrigatório),
  "status": "pago" (se já foi pago/recebido), "pendente" (se for futuro), ou "vencido" (se já passou),
  "categoria": categoria da despesa/receita (se identificável),
  "formaPagamento": "pix", "dinheiro", "cartao_credito", "boleto", etc (se mencionado),
  "confidence": número entre 0 e 1 indicando confiança na extração
}

Regras importantes:
1. Se o usuário usa verbos no passado ("paguei", "recebi", "pago"), status deve ser "pago"
2. Se usa futuro ("vou pagar", "pagarei", "a receber"), status deve ser "pendente"
3. Datas relativas:
   - "hoje" = ${dateStr}
   - "amanhã" = um dia depois de hoje
   - "semana que vem" = 7 dias depois
   - Se não mencionar data, usar hoje
4. Para "tipo":
   - Palavras como "paguei", "pagar", "despesa", "conta" → "pagar"
   - Palavras como "recebi", "receber", "venda", "cliente" → "receber"
5. Valor sempre deve ser um número (sem R$, pontos ou vírgulas)
6. Confidence:
   - 0.9-1.0: Todos os dados principais presentes e claros
   - 0.7-0.9: Dados principais presentes mas com alguma ambiguidade
   - 0.5-0.7: Faltam informações importantes
   - 0.0-0.5: Mensagem muito vaga ou incompleta

Exemplos:

Mensagem: "Paguei R$ 500 para Eletropaulo hoje"
{
  "tipo": "pagar",
  "valor": 500,
  "descricao": "Conta de energia elétrica",
  "beneficiario": "Eletropaulo",
  "vencimento": "${currentDate.toISOString().split('T')[0]}",
  "status": "pago",
  "categoria": "Utilidades",
  "confidence": 0.95
}

Mensagem: "Vou receber 1200 do João dia 25"
{
  "tipo": "receber",
  "valor": 1200,
  "descricao": "Recebimento do cliente João",
  "beneficiario": "João",
  "vencimento": "${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-25",
  "status": "pendente",
  "confidence": 0.85
}
`;
  }

  /**
   * Normalize and validate extracted data
   */
  private normalizeExtractedData(extracted: any, currentDate: Date): AIExtractionResult {
    // Ensure required fields
    const tipo = extracted.tipo === 'receber' ? 'receber' : 'pagar';
    const valor = Math.abs(Number(extracted.valor) || 0);

    // Normalize date
    let vencimento: string;
    try {
      vencimento = new Date(extracted.vencimento).toISOString();
    } catch {
      vencimento = currentDate.toISOString();
    }

    // Determine status based on date and explicit status
    let status: 'pago' | 'pendente' | 'vencido' = extracted.status || 'pendente';
    if (status === 'pendente') {
      const dueDate = new Date(vencimento);
      if (dueDate < currentDate) {
        status = 'vencido';
      }
    }

    // Build description
    let descricao = extracted.descricao || '';
    if (!descricao && extracted.beneficiario) {
      descricao = `${tipo === 'pagar' ? 'Pagamento para' : 'Recebimento de'} ${extracted.beneficiario}`;
    }

    // Calculate confidence
    let confidence = Number(extracted.confidence) || 0.5;

    // Adjust confidence based on data completeness
    if (!valor || valor === 0) confidence = Math.min(confidence, 0.3);
    if (!descricao && !extracted.beneficiario) confidence = Math.min(confidence, 0.4);

    return {
      tipo,
      valor,
      descricao: descricao || 'Transação via WhatsApp',
      beneficiario: extracted.beneficiario || undefined,
      vencimento,
      status,
      categoria: extracted.categoria || undefined,
      formaPagamento: extracted.formaPagamento || undefined,
      confidence: Math.max(0, Math.min(1, confidence)),
    };
  }

  /**
   * Validate extracted data
   */
  async validateExtraction(data: AIExtractionResult): Promise<ValidationResult> {
    const errors: string[] = [];
    const missingFields: string[] = [];

    // Required field validation
    if (!data.tipo) {
      errors.push('Tipo de transação não identificado');
      missingFields.push('tipo');
    }

    if (!data.valor || data.valor <= 0) {
      errors.push('Valor inválido ou não identificado');
      missingFields.push('valor');
    }

    if (!data.vencimento) {
      errors.push('Data não identificada');
      missingFields.push('vencimento');
    }

    if (!data.descricao && !data.beneficiario) {
      errors.push('Falta descrição ou beneficiário');
      missingFields.push('descricao ou beneficiario');
    }

    // Confidence threshold
    const needsConfirmation = data.confidence < 0.9 || missingFields.length > 0;

    return {
      isValid: errors.length === 0,
      errors,
      needsConfirmation,
      missingFields,
    };
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  calculateConfidence(data: AIExtractionResult): number {
    let score = data.confidence;

    // Adjust based on data completeness
    const completenessFactors = [
      data.valor > 0,
      (data.descricao?.length || 0) > 0,
      (data.beneficiario?.length || 0) > 0,
      (data.categoria?.length || 0) > 0,
      (data.formaPagamento?.length || 0) > 0,
    ];

    const completeness = completenessFactors.filter(Boolean).length / completenessFactors.length;
    score = score * (0.7 + completeness * 0.3);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect if message is a command (not a transaction)
   */
  detectCommand(message: string): string | null {
    const lowerMessage = message.toLowerCase().trim();

    const commands: Record<string, string> = {
      'ajuda': 'help',
      'help': 'help',
      'saldo': 'balance',
      'relatorio': 'report',
      'relatório': 'report',
      'relatorio do mes': 'monthly_report',
      'relatório do mês': 'monthly_report',
      'contas': 'list_bills',
    };

    for (const [keyword, command] of Object.entries(commands)) {
      if (lowerMessage.includes(keyword)) {
        return command;
      }
    }

    return null;
  }
}

export const aiService = new AIService();
