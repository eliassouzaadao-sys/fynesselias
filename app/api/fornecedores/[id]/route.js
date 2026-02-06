import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// GET: Obter fornecedor com detalhes e contas vinculadas
export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const fornecedorId = parseInt(id);

    if (isNaN(fornecedorId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const where = {
      id: fornecedorId,
      userId: user.id,
      tipo: 'fornecedor',
    };
    if (empresaId) where.empresaId = empresaId;

    const fornecedor = await prisma.pessoa.findFirst({
      where,
      include: {
        contas: {
          orderBy: { vencimento: 'desc' },
          take: 50,
        },
      },
    });

    if (!fornecedor) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Calcular estatísticas
    const stats = await prisma.conta.aggregate({
      where: {
        pessoaId: fornecedorId,
        tipo: 'pagar',
      },
      _sum: { valor: true },
      _count: true,
    });

    const contasPagas = await prisma.conta.aggregate({
      where: {
        pessoaId: fornecedorId,
        tipo: 'pagar',
        pago: true,
      },
      _sum: { valor: true },
      _count: true,
    });

    const contasPendentes = await prisma.conta.aggregate({
      where: {
        pessoaId: fornecedorId,
        tipo: 'pagar',
        pago: false,
      },
      _sum: { valor: true },
      _count: true,
    });

    return NextResponse.json({
      ...fornecedor,
      estatisticas: {
        totalContas: stats._count || 0,
        valorTotal: stats._sum.valor || 0,
        contasPagas: contasPagas._count || 0,
        valorPago: contasPagas._sum.valor || 0,
        contasPendentes: contasPendentes._count || 0,
        valorPendente: contasPendentes._sum.valor || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedor' },
      { status: 500 }
    );
  }
}
