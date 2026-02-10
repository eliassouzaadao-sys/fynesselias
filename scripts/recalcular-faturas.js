/**
 * Script para recalcular o valorTotal de todas as faturas
 * Execução: node scripts/recalcular-faturas.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalcularFaturas() {
  try {
    console.log('🔄 Iniciando recálculo de faturas...\n');

    // Buscar todas as faturas
    const faturas = await prisma.fatura.findMany({
      select: {
        id: true,
        cartaoId: true,
        mesReferencia: true,
        anoReferencia: true,
        valorTotal: true,
        userId: true,
        empresaId: true
      }
    });

    console.log(`📊 Encontradas ${faturas.length} faturas para analisar\n`);

    let faturasAtualizadas = 0;
    let diferencaTotal = 0;

    for (const fatura of faturas) {
      // Calcular período da fatura (mês de uso)
      const inicioMes = new Date(fatura.anoReferencia, fatura.mesReferencia - 1, 1, 0, 0, 0);
      const fimMes = new Date(fatura.anoReferencia, fatura.mesReferencia, 0, 23, 59, 59);

      // Buscar todas as contas vinculadas ao cartão neste período
      const contasWhere = {
        userId: fatura.userId,
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

      if (fatura.empresaId) {
        contasWhere.empresaId = fatura.empresaId;
      }

      const contas = await prisma.conta.findMany({
        where: contasWhere,
        select: { valor: true }
      });

      const valorTotalCalculado = contas.reduce((acc, conta) => acc + conta.valor, 0);
      const diferenca = Math.abs(valorTotalCalculado - fatura.valorTotal);

      // Atualizar apenas se houver diferença
      if (diferenca > 0.01) { // Tolerância de 1 centavo
        await prisma.fatura.update({
          where: { id: fatura.id },
          data: { valorTotal: valorTotalCalculado }
        });

        console.log(
          `✅ Fatura ${fatura.id} (${fatura.mesReferencia}/${fatura.anoReferencia}): ` +
          `R$ ${fatura.valorTotal.toFixed(2)} → R$ ${valorTotalCalculado.toFixed(2)} ` +
          `(diferença: R$ ${diferenca.toFixed(2)})`
        );

        faturasAtualizadas++;
        diferencaTotal += diferenca;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✨ Recálculo concluído!`);
    console.log(`   Faturas analisadas: ${faturas.length}`);
    console.log(`   Faturas atualizadas: ${faturasAtualizadas}`);
    console.log(`   Diferença total corrigida: R$ ${diferencaTotal.toFixed(2)}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erro ao recalcular faturas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recalcularFaturas();
