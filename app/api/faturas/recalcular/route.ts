import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

/**
 * POST /api/faturas/recalcular
 * Recalcula o valorTotal de todas as faturas baseado nas contas reais vinculadas
 * Útil para corrigir inconsistências após exclusão de contas
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    console.log("🔄 Iniciando recálculo de faturas...");

    // Buscar todas as faturas do usuário
    const faturasWhere: any = { userId: user.id };
    if (empresaId) faturasWhere.empresaId = empresaId;

    const faturas = await prisma.fatura.findMany({
      where: faturasWhere,
      select: {
        id: true,
        cartaoId: true,
        mesReferencia: true,
        anoReferencia: true,
        valorTotal: true
      }
    });

    console.log(`📊 Encontradas ${faturas.length} faturas para recalcular`);

    let faturasAtualizadas = 0;
    let diferencaTotal = 0;

    for (const fatura of faturas) {
      // Calcular período da fatura (mês de uso)
      const inicioMes = new Date(fatura.anoReferencia, fatura.mesReferencia - 1, 1, 0, 0, 0);
      const fimMes = new Date(fatura.anoReferencia, fatura.mesReferencia, 0, 23, 59, 59);

      // Buscar todas as contas vinculadas ao cartão neste período
      const contasWhere: any = {
        userId: user.id,
        cartaoId: fatura.cartaoId,
        vencimento: {
          gte: inicioMes,
          lte: fimMes
        },
        OR: [
          { totalParcelas: null }, // Contas simples
          { parentId: { not: null } }, // Parcelas individuais
        ]
      };
      if (empresaId) contasWhere.empresaId = empresaId;

      const contas = await prisma.conta.findMany({
        where: contasWhere,
        select: { valor: true }
      });

      const valorTotalCalculado = contas.reduce((acc: number, conta: { valor: number }) => acc + conta.valor, 0);
      const diferenca = Math.abs(valorTotalCalculado - fatura.valorTotal);

      // Atualizar apenas se houver diferença
      if (diferenca > 0.01) { // Tolerância de 1 centavo para erros de arredondamento
        await prisma.fatura.update({
          where: { id: fatura.id },
          data: { valorTotal: valorTotalCalculado }
        });

        console.log(
          `   ✅ Fatura ${fatura.id} (${fatura.mesReferencia}/${fatura.anoReferencia}): ` +
          `${fatura.valorTotal.toFixed(2)} → ${valorTotalCalculado.toFixed(2)} ` +
          `(diferença: ${diferenca.toFixed(2)})`
        );

        faturasAtualizadas++;
        diferencaTotal += diferenca;
      }
    }

    console.log(`✨ Recálculo concluído: ${faturasAtualizadas} faturas atualizadas`);

    return NextResponse.json({
      success: true,
      message: `Recálculo concluído com sucesso`,
      faturasAnalisadas: faturas.length,
      faturasAtualizadas,
      diferencaTotal: diferencaTotal.toFixed(2)
    });
  } catch (error) {
    console.error("❌ Erro ao recalcular faturas:", error);
    return NextResponse.json(
      { error: "Erro ao recalcular faturas" },
      { status: 500 }
    );
  }
}
