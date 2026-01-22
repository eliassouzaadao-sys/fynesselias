/**
 * WhatsApp Business API Service
 * Handles all WhatsApp message operations
 */

interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template';
}

interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio';
  text?: {
    body: string;
  };
}

export class WhatsAppService {
  private apiUrl: string;
  private apiToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Send a text message to a WhatsApp number
   */
  async sendMessage({ to, message, type = 'text' }: WhatsAppMessage): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type,
            text: {
              body: message,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send a confirmation request for a transaction
   */
  async sendConfirmationRequest(
    phoneNumber: string,
    extractedData: any,
    confidence: number
  ): Promise<boolean> {
    const message = this.formatConfirmationMessage(extractedData, confidence);
    return this.sendMessage({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Format a confirmation message for the user
   */
  private formatConfirmationMessage(data: any, confidence: number): string {
    const { tipo, valor, descricao, beneficiario, vencimento, status } = data;

    const tipoText = tipo === 'pagar' ? 'Pagamento' : 'Recebimento';
    const valorFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);

    const dateFormatted = new Date(vencimento).toLocaleDateString('pt-BR');

    if (confidence > 0.9) {
      // High confidence - auto-confirmed
      return `✅ *Registrado com sucesso!*

${tipoText} de ${valorFormatted}
${beneficiario ? `Para/De: ${beneficiario}` : ''}
Data: ${dateFormatted}
Status: ${status === 'pago' ? 'Pago' : 'Pendente'}
${descricao ? `\nDescrição: ${descricao}` : ''}

Acesse o painel para mais detalhes.`;
    } else if (confidence > 0.7) {
      // Medium confidence - needs confirmation
      return `❓ *Confirme os dados:*

${tipoText} de ${valorFormatted}
${beneficiario ? `Para/De: ${beneficiario}` : ''}
Data: ${dateFormatted}
Status: ${status === 'pago' ? 'Pago' : 'Pendente'}
${descricao ? `\nDescrição: ${descricao}` : ''}

Está correto? Responda *SIM* para confirmar ou *NÃO* para corrigir.`;
    } else {
      // Low confidence - request more info
      return `ℹ️ *Preciso de mais informações:*

Entendi que você quer registrar:
${tipoText} de ${valorFormatted || '???'}
${beneficiario ? `Para/De: ${beneficiario}` : 'Para/De: ???'}

Por favor, envie novamente com mais detalhes. Exemplo:
"Paguei R$ 500 para Eletropaulo hoje"`;
    }
  }

  /**
   * Send a success message
   */
  async sendSuccessMessage(phoneNumber: string, transactionId: number): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: `✅ *Transação registrada!*

ID: #${transactionId}

Acesse o painel para visualizar todos os detalhes.`,
    });
  }

  /**
   * Send an error message
   */
  async sendErrorMessage(phoneNumber: string, error: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: `❌ *Erro ao processar mensagem*

${error}

Tente novamente ou entre em contato com o suporte.`,
    });
  }

  /**
   * Send help message
   */
  async sendHelpMessage(phoneNumber: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: `📱 *Fyness - Ajuda*

*Comandos disponíveis:*

📥 *Registrar Despesa*
"Paguei R$ 500 para Eletropaulo hoje"

📤 *Registrar Recebimento*
"Recebi R$ 1.200 do cliente João dia 25/02"

💰 *Ver Saldo*
Digite: "saldo"

📊 *Relatório*
Digite: "relatório do mês"

❓ *Ajuda*
Digite: "ajuda"

*Dicas:*
- Seja específico com valores e datas
- Mencione sempre o nome da empresa/cliente
- Use datas como: hoje, amanhã, 25/02, etc.`,
    });
  }

  /**
   * Verify webhook signature (security)
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    // TODO: Implement signature verification
    // Use crypto to verify HMAC signature from WhatsApp
    return true;
  }

  /**
   * Extract message from webhook payload
   */
  extractMessageFromWebhook(payload: any): WhatsAppWebhookMessage | null {
    try {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (!message) {
        return null;
      }

      return {
        from: message.from,
        id: message.id,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text,
      };
    } catch (error) {
      console.error('Failed to extract message from webhook:', error);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
