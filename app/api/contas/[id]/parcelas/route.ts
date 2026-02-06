/**
 * API para editar conta parcelada (conta pai) e propagar alterações para parcelas futuras
 * PUT /api/contas/[id]/parcelas - Atualiza conta pai e propaga para parcelas não pagas
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

// Função auxiliar para atualizar centro de custo
async function updateCentroAndParent(sigla: string, field: string, increment: number, userId: number) {
  if (!sigla || !userId) return;

  try {
    const centro = await prisma.centroCusto.findFirst({
      where: { sigla, userId },
    });

    if (!centro) return;

    await prisma.centroCusto.update({
      where: { id: centro.id },
      data: {
        [field]: {
          increment: increment,
        },
      },
    });

    // Propagar para ancestrais
    if (centro.parentId) {
      await propagateToAncestors(centro.parentId, field, increment, userId);
    }
  } catch (error) {
    console.error(`Error updating centro ${sigla}:`, error);
  }
}

async function propagateToAncestors(parentId: number, field: string, increment: number, userId: number) {
  if (!parentId) return;

  try {
    const parent = await prisma.centroCusto.findFirst({
      where: { id: parentId, userId },
    });

    if (!parent) return;

    await prisma.centroCusto.update({
      where: { id: parentId },
      data: {
        [field]: {
          increment: increment,
        },
      },
    });

    if (parent.parentId) {
      await propagateToAncestors(parent.parentId, field, increment, userId);
    }
  } catch (error) {
    console.error(`Error propagating to parent ${parentId}:`, error);
  }
}

// Buscar ID do sócio pelo código do centro de custo
async function getSocioIdByCentroCusto(sigla: string | null, userId: number, empresaId?: number | null): Promise<number | null> {
  if (!sigla) return null;

  try {
    const where: any = { sigla, userId };
    if (empresaId) where.empresaId = empresaId;

    const centro = await prisma.centroCusto.findFirst({
      where,
      select: { id: true, isSocio: true }
    });

    if (centro && centro.isSocio) {
      return centro.id;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar sócio pelo centro de custo:', error);
    return null;
  }
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PUT - Atualiza conta parcelada e propaga alterações para parcelas futuras (não pagas)
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
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await request.json();

    // Verificar se a conta existe e é uma conta pai de parcelamento
    const where: any = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const contaPai = await prisma.conta.findFirst({
      where,
      include: {
        parcelas: {
          orderBy: { vencimento: 'asc' }
        }
      }
    });

    if (!contaPai) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    if (!contaPai.totalParcelas || contaPai.parcelas.length === 0) {
      return NextResponse.json(
        { error: 'Esta conta não é uma conta parcelada' },
        { status: 400 }
      );
    }

    // Extrair dados da requisição
    const {
      descricao,
      valorTotal: novoValorTotal,
      totalParcelas: novoTotalParcelas,
      beneficiario,
      codigoTipo,
      numeroDocumento,
      vencimentoPrimeiraParcela,
      cartaoId,
      bancoContaId,
      formaPagamento,
      observacoes,
      propagarParaFuturas = true, // Por padrão, propaga para parcelas futuras
    } = data;

    const valorTotal = novoValorTotal !== undefined ? Number(novoValorTotal) : contaPai.valorTotal;
    const totalParcelas = novoTotalParcelas !== undefined ? parseInt(novoTotalParcelas) : contaPai.totalParcelas;

    // Validações
    if (totalParcelas < 1) {
      return NextResponse.json(
        { error: 'Total de parcelas deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (valorTotal <= 0) {
      return NextResponse.json(
        { error: 'Valor total deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Separar parcelas pagas e não pagas
    const parcelasPagas = contaPai.parcelas.filter(p => p.pago);
    const parcelasNaoPagas = contaPai.parcelas.filter(p => !p.pago);

    console.log(`📝 Editando conta parcelada ID: ${id}`);
    console.log(`   Parcelas pagas: ${parcelasPagas.length}, Não pagas: ${parcelasNaoPagas.length}`);
    console.log(`   Valor total atual: ${contaPai.valorTotal}, Novo: ${valorTotal}`);
    console.log(`   Total parcelas atual: ${contaPai.totalParcelas}, Novo: ${totalParcelas}`);

    // Se mudou a quantidade de parcelas, precisamos recalcular
    const mudouQuantidadeParcelas = totalParcelas !== contaPai.totalParcelas;
    const mudouValorTotal = valorTotal !== contaPai.valorTotal;

    // Calcular novo valor por parcela
    const novoValorParcela = valorTotal / totalParcelas;

    // Buscar sócio pelo centro de custo (se mudou)
    const socioIdFromCentro = codigoTipo
      ? await getSocioIdByCentroCusto(codigoTipo, user.id, empresaId)
      : null;

    // Atualizar centro de custo se mudou o valor total
    if (mudouValorTotal && contaPai.codigoTipo) {
      const whereCentroAtual: any = { sigla: contaPai.codigoTipo, userId: user.id };
      if (empresaId) whereCentroAtual.empresaId = empresaId;

      const centroAtual = await prisma.centroCusto.findFirst({
        where: whereCentroAtual,
        select: { isSocio: true }
      });

      if (centroAtual && !centroAtual.isSocio) {
        const diferenca = valorTotal - (contaPai.valorTotal || 0);
        await updateCentroAndParent(contaPai.codigoTipo, 'previsto', diferenca, user.id);
        console.log(`📊 Centro ${contaPai.codigoTipo} previsto atualizado: ${diferenca > 0 ? '+' : ''}${diferenca}`);
      }
    }

    // Atualizar a conta pai
    const updatePaiData: any = {
      valor: valorTotal,
      valorTotal: valorTotal,
      totalParcelas: totalParcelas,
    };

    if (descricao !== undefined) updatePaiData.descricao = descricao;
    if (beneficiario !== undefined) updatePaiData.beneficiario = beneficiario;
    if (codigoTipo !== undefined) updatePaiData.codigoTipo = codigoTipo;
    if (numeroDocumento !== undefined) updatePaiData.numeroDocumento = numeroDocumento;
    if (socioIdFromCentro) updatePaiData.socioResponsavelId = socioIdFromCentro;
    if (cartaoId !== undefined) updatePaiData.cartaoId = cartaoId ? Number(cartaoId) : null;
    if (bancoContaId !== undefined) updatePaiData.bancoContaId = bancoContaId ? Number(bancoContaId) : null;
    if (formaPagamento !== undefined) updatePaiData.formaPagamento = formaPagamento;
    if (observacoes !== undefined) updatePaiData.observacoes = observacoes;

    await prisma.conta.update({
      where: { id },
      data: updatePaiData,
    });

    console.log('✅ Conta pai atualizada');

    // Se não deve propagar ou não há mudanças significativas, retornar
    if (!propagarParaFuturas) {
      const contaAtualizada = await prisma.conta.findUnique({
        where: { id },
        include: { parcelas: { orderBy: { vencimento: 'asc' } } }
      });
      return NextResponse.json({
        success: true,
        message: 'Conta pai atualizada (sem propagação)',
        conta: contaAtualizada,
      });
    }

    // Lógica de propagação para parcelas futuras
    let parcelasAtualizadas = 0;
    let parcelasCriadas = 0;
    let parcelasRemovidas = 0;

    // Se mudou a quantidade de parcelas, precisamos reorganizar
    if (mudouQuantidadeParcelas) {
      // Calcular quantas parcelas não pagas precisamos ter
      const parcelasNaoPagasNecessarias = totalParcelas - parcelasPagas.length;

      if (parcelasNaoPagasNecessarias < 0) {
        return NextResponse.json(
          { error: `Não é possível reduzir para ${totalParcelas} parcelas. Já existem ${parcelasPagas.length} parcelas pagas.` },
          { status: 400 }
        );
      }

      // Determinar a data base para novas parcelas
      const primeiraParcelaNaoPaga = parcelasNaoPagas[0];
      let dataBaseVencimento = primeiraParcelaNaoPaga
        ? new Date(primeiraParcelaNaoPaga.vencimento)
        : (vencimentoPrimeiraParcela ? parseLocalDate(vencimentoPrimeiraParcela) : new Date());

      // Se temos mais parcelas não pagas do que necessário, remover o excesso
      if (parcelasNaoPagas.length > parcelasNaoPagasNecessarias) {
        const parcelasParaRemover = parcelasNaoPagas.slice(parcelasNaoPagasNecessarias);
        for (const parcela of parcelasParaRemover) {
          await prisma.conta.delete({ where: { id: parcela.id } });
          parcelasRemovidas++;
        }
        console.log(`🗑️ ${parcelasRemovidas} parcelas removidas`);
      }

      // Se temos menos parcelas não pagas do que necessário, criar novas
      if (parcelasNaoPagas.length < parcelasNaoPagasNecessarias) {
        const parcelasParaCriar = parcelasNaoPagasNecessarias - parcelasNaoPagas.length;
        const ultimaParcelaNaoPaga = parcelasNaoPagas[parcelasNaoPagas.length - 1];
        let proximaData = ultimaParcelaNaoPaga
          ? new Date(ultimaParcelaNaoPaga.vencimento)
          : dataBaseVencimento;

        for (let i = 0; i < parcelasParaCriar; i++) {
          proximaData = new Date(proximaData);
          proximaData.setMonth(proximaData.getMonth() + 1);

          const numeroParcela = parcelasPagas.length + parcelasNaoPagas.length + parcelasCriadas + 1;

          const novaParcelaData: any = {
            descricao: descricao
              ? `${descricao} - Parcela ${numeroParcela}/${totalParcelas}`
              : `${contaPai.descricao} - Parcela ${numeroParcela}/${totalParcelas}`,
            valor: novoValorParcela,
            vencimento: proximaData,
            pago: false,
            tipo: contaPai.tipo,
            numeroParcela: `${numeroParcela}/${totalParcelas}`,
            parentId: id,
            userId: user.id,
            empresaId: empresaId || undefined,
          };

          if (beneficiario !== undefined) novaParcelaData.beneficiario = beneficiario;
          else if (contaPai.beneficiario) novaParcelaData.beneficiario = contaPai.beneficiario;

          if (codigoTipo !== undefined) novaParcelaData.codigoTipo = codigoTipo;
          else if (contaPai.codigoTipo) novaParcelaData.codigoTipo = contaPai.codigoTipo;

          // Cartão: usar o novo se fornecido, senão manter o existente
          if (cartaoId !== undefined) novaParcelaData.cartaoId = cartaoId ? Number(cartaoId) : null;
          else if (contaPai.cartaoId) novaParcelaData.cartaoId = contaPai.cartaoId;

          // Banco: usar o novo se fornecido, senão manter o existente
          if (bancoContaId !== undefined) novaParcelaData.bancoContaId = bancoContaId ? Number(bancoContaId) : null;
          else if (contaPai.bancoContaId) novaParcelaData.bancoContaId = contaPai.bancoContaId;

          if (socioIdFromCentro) novaParcelaData.socioResponsavelId = socioIdFromCentro;
          else if (contaPai.socioResponsavelId) novaParcelaData.socioResponsavelId = contaPai.socioResponsavelId;

          await prisma.conta.create({ data: novaParcelaData });
          parcelasCriadas++;
        }
        console.log(`✨ ${parcelasCriadas} novas parcelas criadas`);
      }
    }

    // Atualizar as parcelas não pagas existentes (que não foram removidas)
    const parcelasNaoPagasRestantes = await prisma.conta.findMany({
      where: {
        parentId: id,
        pago: false,
        userId: user.id,
      },
      orderBy: { vencimento: 'asc' }
    });

    for (let i = 0; i < parcelasNaoPagasRestantes.length; i++) {
      const parcela = parcelasNaoPagasRestantes[i];
      const numeroParcela = parcelasPagas.length + i + 1;

      const updateParcelaData: any = {
        valor: novoValorParcela,
        numeroParcela: `${numeroParcela}/${totalParcelas}`,
      };

      // Atualizar descrição se mudou
      if (descricao !== undefined) {
        updateParcelaData.descricao = `${descricao} - Parcela ${numeroParcela}/${totalParcelas}`;
      }

      // Propagar outros campos se fornecidos
      if (beneficiario !== undefined) updateParcelaData.beneficiario = beneficiario;
      if (codigoTipo !== undefined) updateParcelaData.codigoTipo = codigoTipo;
      if (socioIdFromCentro) updateParcelaData.socioResponsavelId = socioIdFromCentro;

      await prisma.conta.update({
        where: { id: parcela.id },
        data: updateParcelaData,
      });

      parcelasAtualizadas++;
    }

    console.log(`✅ ${parcelasAtualizadas} parcelas atualizadas`);

    // Atualizar também o numeroParcela das parcelas pagas para refletir o novo total
    for (let i = 0; i < parcelasPagas.length; i++) {
      const parcela = parcelasPagas[i];
      await prisma.conta.update({
        where: { id: parcela.id },
        data: {
          numeroParcela: `${i + 1}/${totalParcelas}`,
        },
      });
    }

    // Buscar conta atualizada com todas as parcelas
    const contaAtualizada = await prisma.conta.findUnique({
      where: { id },
      include: {
        parcelas: { orderBy: { vencimento: 'asc' } },
        pessoa: true,
      }
    });

    console.log(`✅ Edição concluída: ${parcelasAtualizadas} atualizadas, ${parcelasCriadas} criadas, ${parcelasRemovidas} removidas`);

    return NextResponse.json({
      success: true,
      message: `Conta parcelada atualizada. ${parcelasAtualizadas} parcelas atualizadas${parcelasCriadas > 0 ? `, ${parcelasCriadas} criadas` : ''}${parcelasRemovidas > 0 ? `, ${parcelasRemovidas} removidas` : ''}.`,
      conta: contaAtualizada,
      resumo: {
        parcelasAtualizadas,
        parcelasCriadas,
        parcelasRemovidas,
        novoValorParcela,
        totalParcelas,
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar conta parcelada:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conta parcelada' },
      { status: 500 }
    );
  }
}
