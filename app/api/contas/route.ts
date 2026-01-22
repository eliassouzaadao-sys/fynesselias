/**
 * API Routes for Contas (Accounts Payable/Receivable)
 * GET /api/contas - List all contas with filters
 * POST /api/contas - Create new conta
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET - List contas with optional filters
 * Query params:
 * - tipo: 'pagar' | 'receber' - filter by type
 * - status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
 * - pago: 'true' | 'false'
 * - includeFluxoCaixa: 'true' | 'false' - include items already in cash flow
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');
    const pago = searchParams.get('pago');
    const includeFluxoCaixa = searchParams.get('includeFluxoCaixa') === 'true';

    // Build where clause
    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (status) {
      where.status = status;
    }

    if (pago !== null) {
      where.pago = pago === 'true';
    }

    // By default, exclude items already in cash flow unless explicitly requested
    if (!includeFluxoCaixa) {
      where.noFluxoCaixa = false;
    }

    const contas = await prisma.conta.findMany({
      where,
      include: {
        pessoa: true,
      },
      orderBy: {
        vencimento: 'asc',
      },
    });

    // Auto-update status based on vencimento for pending items
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const contasAtualizadas = await Promise.all(
      contas.map(async (conta: any) => {
        // Only update status if not paid and status is pendente
        if (!conta.pago && conta.status === 'pendente') {
          const vencimento = new Date(conta.vencimento);
          vencimento.setHours(0, 0, 0, 0);

          if (vencimento < hoje) {
            // Update to vencido
            const updated = await prisma.conta.update({
              where: { id: conta.id },
              data: { status: 'vencido' },
              include: { pessoa: true },
            });
            return updated;
          }
        }
        return conta;
      })
    );

    return NextResponse.json(contasAtualizadas);
  } catch (error) {
    console.error('Error fetching contas:', error);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST - Create new conta
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.descricao || !data.valor || !data.vencimento || !data.tipo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: descricao, valor, vencimento, tipo' },
        { status: 400 }
      );
    }

    if (!['pagar', 'receber'].includes(data.tipo)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "pagar" ou "receber"' },
        { status: 400 }
      );
    }

    // Determine initial status based on vencimento
    const vencimento = new Date(data.vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);

    let status = 'pendente';
    if (data.pago) {
      status = 'pago';
    } else if (vencimento < hoje) {
      status = 'vencido';
    }

    // Create conta
    const novaConta = await prisma.conta.create({
      data: {
        descricao: data.descricao,
        valor: Number(data.valor),
        vencimento: new Date(data.vencimento),
        pago: data.pago ?? false,
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
        tipo: data.tipo,
        beneficiario: data.beneficiario || null,
        banco: data.banco || null,
        categoria: data.categoria || null,
        formaPagamento: data.formaPagamento || null,
        numeroDocumento: data.numeroDocumento || null,
        observacoes: data.observacoes || null,
        comprovante: data.comprovante || null,
        status,
        noFluxoCaixa: data.pago ?? false, // If paid on creation, add to cash flow
        pessoaId: data.pessoaId ? Number(data.pessoaId) : null,
        createdViaWhatsApp: data.createdViaWhatsApp ?? false,
        aiConfidence: data.aiConfidence || null,
      },
      include: {
        pessoa: true,
      },
    });

    return NextResponse.json(novaConta, { status: 201 });
  } catch (error) {
    console.error('Error creating conta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
