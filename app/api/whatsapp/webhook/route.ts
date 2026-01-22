/**
 * WhatsApp Webhook Endpoint
 * Receives messages from WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/services/whatsapp.service';
import { aiService } from '@/lib/services/ai.service';
import { contasService } from '@/lib/services';
import prisma from '@/lib/prisma';

/**
 * GET - Webhook verification (required by WhatsApp)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'fyness_webhook_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST - Receive WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract message from webhook payload
    const message = whatsappService.extractMessageFromWebhook(body);

    if (!message || message.type !== 'text' || !message.text?.body) {
      // Not a text message or invalid payload
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const phoneNumber = message.from;
    const messageContent = message.text.body;
    const messageId = message.id;

    console.log(`Received WhatsApp message from ${phoneNumber}: ${messageContent}`);

    // Check if it's a command
    const command = aiService.detectCommand(messageContent);

    if (command) {
      await handleCommand(phoneNumber, command);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Process financial message
    await processFinancialMessage({
      phoneNumber,
      messageContent,
      messageId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    // Always return 200 to WhatsApp to avoid retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Process a financial message with AI
 */
async function processFinancialMessage({
  phoneNumber,
  messageContent,
  messageId,
}: {
  phoneNumber: string;
  messageContent: string;
  messageId: string;
}) {
  try {
    // TODO: Verify user is authenticated and get userId
    // For now, we'll skip user verification

    // Extract financial data using AI
    const extractedData = await aiService.extractFinancialData(messageContent);

    // Validate extraction
    const validation = await aiService.validateExtraction(extractedData);

    // Save message to database for tracking
    const whatsappMessage = await prisma.whatsAppMessage.create({
      data: {
        phoneNumber,
        message: messageContent,
        extractedData: extractedData as any,
        aiConfidence: extractedData.confidence,
        status: validation.isValid ? 'processed' : 'needs_confirmation',
      },
    });

    // Decide action based on confidence
    if (extractedData.confidence >= 0.9 && validation.isValid) {
      // High confidence - auto-create transaction
      const conta = await contasService.create({
        tipo: extractedData.tipo,
        descricao: extractedData.descricao,
        valor: extractedData.valor,
        dataVencimento: extractedData.vencimento,
        status: extractedData.status as any,
        categoria: extractedData.categoria,
        formaPagamento: extractedData.formaPagamento as any,
        beneficiario: extractedData.beneficiario,
        // TODO: Add userId when authentication is implemented
      });

      if (conta.success && conta.data) {
        // Update whatsapp message with conta ID
        await prisma.whatsAppMessage.update({
          where: { id: whatsappMessage.id },
          data: {
            contaId: conta.data.id,
            status: 'processed',
            confirmed: true,
          },
        });

        // Send success message
        await whatsappService.sendSuccessMessage(phoneNumber, Number(conta.data.id));
      }
    } else if (extractedData.confidence >= 0.7) {
      // Medium confidence - request confirmation
      await whatsappService.sendConfirmationRequest(
        phoneNumber,
        extractedData,
        extractedData.confidence
      );
    } else {
      // Low confidence - request more information
      await whatsappService.sendConfirmationRequest(
        phoneNumber,
        extractedData,
        extractedData.confidence
      );
    }
  } catch (error) {
    console.error('Error processing financial message:', error);
    await whatsappService.sendErrorMessage(
      phoneNumber,
      'Não consegui processar sua mensagem. Por favor, tente novamente com mais detalhes.'
    );
  }
}

/**
 * Handle commands (help, balance, report, etc.)
 */
async function handleCommand(phoneNumber: string, command: string) {
  try {
    switch (command) {
      case 'help':
        await whatsappService.sendHelpMessage(phoneNumber);
        break;

      case 'balance':
        // TODO: Implement balance query
        await whatsappService.sendMessage({
          to: phoneNumber,
          message: '💰 *Saldo Atual*\n\nEsta funcionalidade está em desenvolvimento.',
        });
        break;

      case 'report':
      case 'monthly_report':
        // TODO: Implement report generation
        await whatsappService.sendMessage({
          to: phoneNumber,
          message: '📊 *Relatório Financeiro*\n\nEsta funcionalidade está em desenvolvimento.',
        });
        break;

      case 'list_bills':
        // TODO: Implement bill listing
        await whatsappService.sendMessage({
          to: phoneNumber,
          message: '📋 *Lista de Contas*\n\nEsta funcionalidade está em desenvolvimento.',
        });
        break;

      default:
        await whatsappService.sendHelpMessage(phoneNumber);
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
}
