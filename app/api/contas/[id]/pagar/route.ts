/**
 * API Route to mark conta as paid/received
 * POST /api/contas/[id]/pagar
 *
 * This route:
 * 1. Marks the conta as paid (pago = true)
 * 2. Sets dataPagamento to provided date or now
 * 3. Updates status to 'pago'
 * 4. Marks noFluxoCaixa = true (moves to cash flow)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Get conta to check if exists
    const conta = await prisma.conta.findUnique({
      where: { id },
    });

    if (!conta) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (conta.pago) {
      return NextResponse.json(
        { error: 'Conta já foi paga/recebida' },
        { status: 400 }
      );
    }

    // Get optional payment date from request body
    const body = await request.json().catch(() => ({}));
    const dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : new Date();
    const comprovante = body.comprovante || null;

    // Update conta
    const contaAtualizada = await prisma.conta.update({
      where: { id },
      data: {
        pago: true,
        dataPagamento,
        status: 'pago',
        noFluxoCaixa: true,
        comprovante,
      },
      include: {
        pessoa: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: conta.tipo === 'pagar' ? 'Pagamento registrado com sucesso' : 'Recebimento registrado com sucesso',
      data: contaAtualizada,
    });
  } catch (error) {
    console.error('Error marking conta as paid:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar pagamento' },
      { status: 500 }
    );
  }
}
