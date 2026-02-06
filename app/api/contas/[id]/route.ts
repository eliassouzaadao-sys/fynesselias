/**
 * API Routes for individual Conta operations
 * GET /api/contas/[id] - Get single conta
 * PUT /api/contas/[id] - Update conta
 * DELETE /api/contas/[id] - Delete conta
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// Função para criar data sem offset de timezone
function parseLocalDate(dateStr: string | Date): Date {
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date(dateStr);
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET - Fetch single conta by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    const where: any = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const conta = await prisma.conta.findFirst({
      where,
      include: {
        pessoa: true,
      },
    });

    if (!conta) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(conta);
  } catch (error) {
    console.error('Error fetching conta:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conta' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update conta
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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

    // Verificar se a conta pertence ao usuário
    const where: any = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const existingConta = await prisma.conta.findFirst({
      where,
    });

    if (!existingConta) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Prepare update data
    const updateData: any = {};

    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.valor !== undefined) updateData.valor = Number(data.valor);
    if (data.vencimento !== undefined) updateData.vencimento = parseLocalDate(data.vencimento);
    if (data.pago !== undefined) updateData.pago = data.pago;
    if (data.dataPagamento !== undefined) {
      updateData.dataPagamento = data.dataPagamento ? new Date(data.dataPagamento) : null;
    }
    if (data.beneficiario !== undefined) updateData.beneficiario = data.beneficiario;
    if (data.banco !== undefined) updateData.banco = data.banco;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.formaPagamento !== undefined) updateData.formaPagamento = data.formaPagamento;
    if (data.numeroDocumento !== undefined) updateData.numeroDocumento = data.numeroDocumento;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
    if (data.comprovante !== undefined) updateData.comprovante = data.comprovante;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.noFluxoCaixa !== undefined) updateData.noFluxoCaixa = data.noFluxoCaixa;
    if (data.pessoaId !== undefined) {
      updateData.pessoaId = data.pessoaId ? Number(data.pessoaId) : null;
    }
    if (data.cartaoId !== undefined) {
      updateData.cartaoId = data.cartaoId ? Number(data.cartaoId) : null;
    }
    if (data.fonte !== undefined) updateData.fonte = data.fonte;
    if (data.subcategoria !== undefined) updateData.subcategoria = data.subcategoria;
    if (data.codigoTipo !== undefined) updateData.codigoTipo = data.codigoTipo;
    if (data.bancoContaId !== undefined) {
      updateData.bancoContaId = data.bancoContaId ? Number(data.bancoContaId) : null;
    }

    const contaAtualizada = await prisma.conta.update({
      where: { id },
      data: updateData,
      include: {
        pessoa: true,
      },
    });

    return NextResponse.json(contaAtualizada);
  } catch (error) {
    console.error('Error updating conta:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conta' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete conta
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Verificar se a conta pertence ao usuário
    const where: any = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const existingConta = await prisma.conta.findFirst({
      where,
    });

    if (!existingConta) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    await prisma.conta.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting conta:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar conta' },
      { status: 500 }
    );
  }
}
