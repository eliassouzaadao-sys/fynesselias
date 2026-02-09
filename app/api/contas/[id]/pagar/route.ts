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
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';
import { atualizarContaProLabore } from '@/lib/prolabore';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const params = await context.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Get conta to check if exists and belongs to user
    const where: any = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const conta = await prisma.conta.findFirst({
      where,
      include: {
        parcelas: { select: { id: true }, take: 1 } // Verificar se tem filhos (é macro)
      }
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

    // Contas macro não podem ser pagas diretamente - apenas as parcelas individuais
    // Verifica tanto a flag isContaMacro quanto se tem parcelas filhas (para dados antigos)
    const isMacro = conta.isContaMacro ||
      (conta.parcelas && conta.parcelas.length > 0 && !conta.parentId);

    if (isMacro) {
      return NextResponse.json(
        { error: 'Contas macro não podem ser pagas diretamente. Pague as parcelas individualmente.' },
        { status: 400 }
      );
    }

    // Get optional payment date and valorPago from request body
    const body = await request.json().catch(() => ({}));
    const dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : new Date();
    const comprovante = body.comprovante || null;
    // valorPago permite registrar o valor efetivamente pago (pode diferir do valor original)
    const valorPago = body.valorPago !== undefined ? Number(body.valorPago) : null;

    // Update conta
    const contaAtualizada = await prisma.conta.update({
      where: { id },
      data: {
        pago: true,
        dataPagamento,
        valorPago,
        status: 'pago',
        noFluxoCaixa: true,
        comprovante,
      },
      include: {
        pessoa: true,
      },
    });

    // Se a conta tem um sócio responsável, atualizar a conta de pró-labore
    if (conta.socioResponsavelId) {
      await atualizarContaProLabore(conta.socioResponsavelId, user.id, empresaId);
    }

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
