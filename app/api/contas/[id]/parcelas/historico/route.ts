/**
 * API para consultar histórico de alterações de um parcelamento
 * GET /api/contas/[id]/parcelas/historico - id é o grupoParcelamentoId ou ID da conta macro
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const params = await context.params;
    const idParam = params.id;

    // Determinar grupoParcelamentoId
    let grupoParcelamentoId: string = idParam;

    const macroId = parseInt(idParam);
    if (!isNaN(macroId)) {
      const contaMacro = await prisma.conta.findFirst({
        where: {
          id: macroId,
          userId: user.id,
          isContaMacro: true,
          ...(empresaId ? { empresaId } : {})
        }
      });

      if (contaMacro?.grupoParcelamentoId) {
        grupoParcelamentoId = contaMacro.grupoParcelamentoId;
      }
    }

    // Buscar histórico
    const historico = await prisma.historicoParcelamento.findMany({
      where: {
        grupoParcelamentoId,
        userId: user.id,
        ...(empresaId ? { empresaId } : {})
      },
      orderBy: { dataAlteracao: 'desc' },
      take: 50 // Limitar às últimas 50 alterações
    });

    // Formatar resposta
    const historicoFormatado = historico.map((h: typeof historico[number]) => ({
      id: h.id,
      tipoAlteracao: h.tipoAlteracao,
      descricao: h.descricao,
      dataAlteracao: h.dataAlteracao,
      valorTotalAnterior: h.valorTotalAnterior,
      valorTotalNovo: h.valorTotalNovo,
      qtdParcelasAnterior: h.qtdParcelasAnterior,
      qtdParcelasNovo: h.qtdParcelasNovo,
      snapshot: h.snapshotAnterior ? JSON.parse(h.snapshotAnterior) : null
    }));

    return NextResponse.json({
      grupoParcelamentoId,
      historico: historicoFormatado,
      total: historicoFormatado.length
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de parcelamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}
