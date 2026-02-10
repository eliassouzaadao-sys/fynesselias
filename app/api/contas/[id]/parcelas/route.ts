/**
 * API para editar parcelas de um parcelamento
 * PUT /api/contas/[id]/parcelas - id é o grupoParcelamentoId
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// Função para criar data sem offset de timezone
function parseLocalDate(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date(dateStr);
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

// Criar ou atualizar registro no fluxo de caixa
async function atualizarFluxoCaixa(
  parcelaAtualizada: any,
  parcelaAnterior: any,
  userId: number,
  empresaId?: number | null
) {
  const marcouComoPaga = parcelaAtualizada.pago && !parcelaAnterior.pago;
  const desmarcouPaga = !parcelaAtualizada.pago && parcelaAnterior.pago;

  if (marcouComoPaga) {
    // Verificar se já existe registro no fluxo para esta conta
    const fluxoExistente = await prisma.fluxoCaixa.findFirst({
      where: { contaId: parcelaAnterior.id }
    });

    if (!fluxoExistente) {
      // Criar novo registro no fluxo de caixa
      await prisma.fluxoCaixa.create({
        data: {
          dia: parseLocalDate(parcelaAtualizada.dataPagamento),
          codigoTipo: parcelaAnterior.codigoTipo || 'GER',
          fornecedorCliente: parcelaAnterior.beneficiario || 'Não informado',
          descricao: parcelaAnterior.descricao,
          valor: Number(parcelaAtualizada.valor),
          tipo: parcelaAnterior.tipo === 'pagar' ? 'saida' : 'entrada',
          fluxo: 0, // Será recalculado posteriormente
          contaId: parcelaAnterior.id,
          centroCustoSigla: parcelaAnterior.codigoTipo,
          bancoId: parcelaAnterior.bancoContaId,
          cartaoId: parcelaAnterior.cartaoId,
          userId,
          empresaId: empresaId || undefined
        }
      });
      console.log(`   ✅ Criado registro no fluxo de caixa para parcela ${parcelaAnterior.id}`);
    }
  } else if (desmarcouPaga) {
    // Remover registro do fluxo de caixa
    await prisma.fluxoCaixa.deleteMany({
      where: { contaId: parcelaAnterior.id }
    });
    console.log(`   ✅ Removido registro do fluxo de caixa para parcela ${parcelaAnterior.id}`);
  }
}

// Recalcular fatura do cartão para um mês específico
async function recalcularFaturaCartao(
  cartaoId: number,
  dataReferencia: Date,
  userId: number,
  empresaId?: number | null
) {
  const mes = dataReferencia.getMonth() + 1;
  const ano = dataReferencia.getFullYear();

  // Buscar início e fim do mês
  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0, 23, 59, 59);

  // Buscar todas as contas deste cartão neste mês
  const contasDoMes = await prisma.conta.findMany({
    where: {
      cartaoId,
      userId,
      empresaId: empresaId || undefined,
      vencimento: {
        gte: inicioMes,
        lte: fimMes
      }
    }
  });

  const novoTotal = contasDoMes.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  // Verificar se existe fatura para este mês
  const faturaExistente = await prisma.fatura.findFirst({
    where: { cartaoId, mesReferencia: mes, anoReferencia: ano, userId }
  });

  if (faturaExistente) {
    // Atualizar fatura existente
    await prisma.fatura.update({
      where: { id: faturaExistente.id },
      data: { valorTotal: novoTotal }
    });
    console.log(`   ✅ Fatura ${mes}/${ano} atualizada: R$ ${novoTotal.toFixed(2)}`);
  }
}

// Atualizar centro de custo com diferença de valor
async function atualizarCentroCusto(
  codigoTipo: string,
  diferenca: number,
  userId: number,
  empresaId?: number | null
) {
  if (!codigoTipo || diferenca === 0) return;

  try {
    const where: any = { sigla: codigoTipo, userId };
    if (empresaId) where.empresaId = empresaId;

    const centro = await prisma.centroCusto.findFirst({ where });

    if (centro) {
      await prisma.centroCusto.update({
        where: { id: centro.id },
        data: {
          previsto: { increment: diferenca }
        }
      });
      console.log(`   ✅ Centro de custo ${codigoTipo} atualizado: +R$ ${diferenca.toFixed(2)}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar centro de custo:', error);
  }
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// ========================================
// FUNÇÕES PARA HISTÓRICO DE PARCELAMENTO
// ========================================

// Interface do snapshot de parcelamento
interface SnapshotParcelamento {
  valorTotal: number;
  totalParcelas: number;
  descricao: string;
  beneficiario: string | null;
  codigoTipo: string | null;
  parcelas: Array<{
    id: number;
    numeroParcela: string;
    valor: number;
    vencimento: string;
    pago: boolean;
    dataPagamento: string | null;
    status: string;
  }>;
}

// Criar snapshot do estado atual das parcelas
function criarSnapshotParcelas(
  todasParcelas: any[],
  contaMacro: any | null
): SnapshotParcelamento {
  const valorTotal = todasParcelas.reduce((sum, p) => sum + (p.valor || 0), 0);

  return {
    valorTotal,
    totalParcelas: todasParcelas.length,
    descricao: contaMacro?.descricao || todasParcelas[0]?.descricao || '',
    beneficiario: contaMacro?.beneficiario || todasParcelas[0]?.beneficiario || null,
    codigoTipo: contaMacro?.codigoTipo || todasParcelas[0]?.codigoTipo || null,
    parcelas: todasParcelas.map(p => ({
      id: p.id,
      numeroParcela: p.numeroParcela || '',
      valor: p.valor,
      vencimento: p.vencimento instanceof Date ? p.vencimento.toISOString() : String(p.vencimento),
      pago: p.pago,
      dataPagamento: p.dataPagamento ? (p.dataPagamento instanceof Date ? p.dataPagamento.toISOString() : String(p.dataPagamento)) : null,
      status: p.status || 'pendente'
    }))
  };
}

// Detectar tipo de alteração significativa
function detectarTipoAlteracao(
  snapshotAnterior: SnapshotParcelamento,
  novosDados: any
): { tipo: string; descricao: string } | null {
  const { valorTotal: novoValorTotal, novaQuantidade, totalParcelas: novoTotalParcelas, parcelasAtualizadas } = novosDados;

  const qtdNova = novaQuantidade || novoTotalParcelas;

  // Mudança de quantidade
  if (qtdNova && qtdNova !== snapshotAnterior.totalParcelas) {
    return {
      tipo: 'QUANTIDADE',
      descricao: `Alterado de ${snapshotAnterior.totalParcelas} para ${qtdNova} parcelas`
    };
  }

  // Mudança de valor total
  if (novoValorTotal !== undefined && Math.abs(novoValorTotal - snapshotAnterior.valorTotal) > 0.01) {
    return {
      tipo: 'VALOR_TOTAL',
      descricao: `Valor total alterado de R$ ${snapshotAnterior.valorTotal.toFixed(2)} para R$ ${novoValorTotal.toFixed(2)}`
    };
  }

  // Edição individual de parcelas
  if (parcelasAtualizadas && Array.isArray(parcelasAtualizadas)) {
    const alteracoes: string[] = [];
    for (const pa of parcelasAtualizadas) {
      const anterior = snapshotAnterior.parcelas.find(p => p.id === pa.id);
      if (!anterior) {
        // Nova parcela sendo adicionada
        alteracoes.push(`Nova parcela adicionada`);
        continue;
      }
      if (Math.abs(Number(pa.valor) - anterior.valor) > 0.01) {
        alteracoes.push(`Parcela ${anterior.numeroParcela}: valor alterado`);
      }
      const vencAnterior = anterior.vencimento.split('T')[0];
      const vencNovo = String(pa.vencimento).split('T')[0];
      if (vencNovo !== vencAnterior) {
        alteracoes.push(`Parcela ${anterior.numeroParcela}: vencimento alterado`);
      }
    }

    // Verificar parcelas removidas
    const idsRecebidos = new Set(parcelasAtualizadas.filter((p: any) => p.id).map((p: any) => p.id));
    for (const parcelaAnterior of snapshotAnterior.parcelas) {
      if (!idsRecebidos.has(parcelaAnterior.id)) {
        alteracoes.push(`Parcela ${parcelaAnterior.numeroParcela} removida`);
      }
    }

    if (alteracoes.length > 0) {
      return {
        tipo: 'EDICAO_INDIVIDUAL',
        descricao: alteracoes.slice(0, 3).join('; ') + (alteracoes.length > 3 ? ` (+${alteracoes.length - 3})` : '')
      };
    }
  }

  return null;
}

// Salvar histórico de alteração do parcelamento
async function salvarHistoricoParcelamento(
  grupoParcelamentoId: string,
  contaMacroId: number | null,
  tipoAlteracao: string,
  descricao: string,
  snapshotAnterior: SnapshotParcelamento,
  valorTotalNovo: number,
  qtdParcelasNovo: number,
  userId: number,
  empresaId?: number | null
) {
  try {
    await prisma.historicoParcelamento.create({
      data: {
        grupoParcelamentoId,
        contaMacroId,
        tipoAlteracao,
        descricao,
        snapshotAnterior: JSON.stringify(snapshotAnterior),
        valorTotalAnterior: snapshotAnterior.valorTotal,
        valorTotalNovo,
        qtdParcelasAnterior: snapshotAnterior.totalParcelas,
        qtdParcelasNovo,
        userId,
        empresaId: empresaId || undefined
      }
    });
    console.log(`   📜 Histórico salvo: ${descricao}`);
  } catch (error) {
    console.error('Erro ao salvar histórico de parcelamento:', error);
    // Não interrompe o fluxo principal se falhar ao salvar histórico
  }
}

/**
 * PUT - Atualiza parcelas de um parcelamento
 * Suporta:
 * - id como grupoParcelamentoId OU id da conta macro
 * - valorTotal: recalcula todas as parcelas dividindo igualmente
 * - novaQuantidade: adiciona/remove parcelas (remove apenas pendentes)
 * - parcelasAtualizadas: edição individual de parcelas
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const params = await context.params;
    const idParam = params.id;

    const data = await request.json();

    console.log(`📝 Editando parcelamento: ${idParam}`);

    // Tentar buscar como conta macro primeiro (por ID numérico)
    let contaMacro: any = null;
    let grupoParcelamentoId: string = idParam;

    const macroId = parseInt(idParam);
    if (!isNaN(macroId)) {
      contaMacro = await prisma.conta.findFirst({
        where: {
          id: macroId,
          userId: user.id,
          isContaMacro: true,
          ...(empresaId ? { empresaId } : {})
        }
      });

      if (contaMacro) {
        grupoParcelamentoId = contaMacro.grupoParcelamentoId || idParam;
        console.log(`   Conta macro encontrada: ID ${contaMacro.id}, grupo: ${grupoParcelamentoId}`);
      }
    }

    // Buscar todas as parcelas filhas (excluindo a macro)
    const where: any = {
      grupoParcelamentoId,
      userId: user.id,
      isContaMacro: false // Apenas parcelas, não a macro
    };
    if (empresaId) where.empresaId = empresaId;

    let todasParcelas = await prisma.conta.findMany({
      where,
      orderBy: { vencimento: 'asc' }
    });

    // Se não encontrou parcelas, tentar buscar pelo parentId da macro
    if (todasParcelas.length === 0 && contaMacro) {
      todasParcelas = await prisma.conta.findMany({
        where: {
          parentId: contaMacro.id,
          userId: user.id,
          ...(empresaId ? { empresaId } : {})
        },
        orderBy: { vencimento: 'asc' }
      });
    }

    if (todasParcelas.length === 0) {
      return NextResponse.json({ error: 'Parcelamento não encontrado' }, { status: 404 });
    }

    // ========================================
    // CAPTURAR SNAPSHOT ANTES DAS ALTERAÇÕES
    // ========================================
    const snapshotAnterior = criarSnapshotParcelas(todasParcelas, contaMacro);
    const alteracaoDetectada = detectarTipoAlteracao(snapshotAnterior, data);

    // Calcular valor total anterior para comparação
    const valorTotalAnterior = todasParcelas.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const quantidadeAnterior = todasParcelas.length;

    console.log(`   Parcelas existentes: ${quantidadeAnterior}, Valor total: R$ ${valorTotalAnterior.toFixed(2)}`);

    // Extrair dados da requisição
    const {
      descricao,
      beneficiario,
      codigoTipo,
      totalParcelas: novoTotalParcelas,
      valorTotal: novoValorTotal,
      novaQuantidade,
      parcelasAtualizadas,
      tipoParcelamento, // Tipo explícito: "avista" | "valor_total" | "valor_parcela"
    } = data;

    const totalParcelas = novaQuantidade || novoTotalParcelas || quantidadeAnterior;

    // Buscar sócio pelo centro de custo
    const socioIdFromCentro = codigoTipo ? await getSocioIdByCentroCusto(codigoTipo, user.id, empresaId) : null;

    let parcelasModificadas = 0;
    let parcelasCriadas = 0;
    let parcelasRemovidas = 0;
    const cartaoIdParaRecalcular = todasParcelas[0]?.cartaoId;
    const mesesParaRecalcular = new Set<string>();

    // ========================================
    // TRATAMENTO DE VALOR TOTAL (dividir igualmente)
    // ========================================
    if (novoValorTotal !== undefined && novoValorTotal !== valorTotalAnterior) {
      console.log(`   💰 Recalculando valor total: R$ ${valorTotalAnterior.toFixed(2)} → R$ ${novoValorTotal.toFixed(2)}`);

      const novoValorParcela = novoValorTotal / todasParcelas.length;

      // Atualizar valor de TODAS as parcelas igualmente
      for (const parcela of todasParcelas) {
        await prisma.conta.update({
          where: { id: parcela.id },
          data: { valor: novoValorParcela }
        });
        parcelasModificadas++;

        // Marcar mês para recalcular fatura se tem cartão
        if (cartaoIdParaRecalcular && parcela.vencimento) {
          const dataVencimento = new Date(parcela.vencimento);
          mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
        }
      }

      console.log(`   ✅ ${todasParcelas.length} parcelas atualizadas para R$ ${novoValorParcela.toFixed(2)} cada`);

      // Atualizar a conta macro se existir
      if (contaMacro) {
        await prisma.conta.update({
          where: { id: contaMacro.id },
          data: { valor: novoValorTotal, valorTotal: novoValorTotal }
        });
        console.log(`   ✅ Conta macro atualizada com valor total R$ ${novoValorTotal.toFixed(2)}`);
      }

      // Atualizar lista de parcelas com novos valores
      todasParcelas = await prisma.conta.findMany({
        where: { ...where, isContaMacro: false },
        orderBy: { vencimento: 'asc' }
      });
    }

    // ========================================
    // TRATAMENTO DE QUANTIDADE DE PARCELAS
    // (Ignorar se há parcelasAtualizadas - elas já contêm as novas parcelas)
    // ========================================
    const temParcelasAtualizadas = parcelasAtualizadas && Array.isArray(parcelasAtualizadas) && parcelasAtualizadas.length > 0;

    if (novaQuantidade !== undefined && novaQuantidade !== quantidadeAnterior && !temParcelasAtualizadas) {
      console.log(`   📊 Alterando quantidade: ${quantidadeAnterior} → ${novaQuantidade}`);

      const valorTotalAtual = novoValorTotal || todasParcelas.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

      if (novaQuantidade > quantidadeAnterior) {
        // ADICIONAR NOVAS PARCELAS
        const parcelasParaAdicionar = novaQuantidade - quantidadeAnterior;
        const novoValorParcela = valorTotalAtual / novaQuantidade;
        const primeiraParcela = todasParcelas[0];
        const ultimaParcela = todasParcelas[todasParcelas.length - 1];

        console.log(`   ➕ Adicionando ${parcelasParaAdicionar} novas parcelas`);

        // Primeiro, atualizar valor de todas as parcelas existentes
        for (const parcela of todasParcelas) {
          await prisma.conta.update({
            where: { id: parcela.id },
            data: { valor: novoValorParcela }
          });

          if (cartaoIdParaRecalcular && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
          }
        }

        // Criar novas parcelas
        for (let i = 0; i < parcelasParaAdicionar; i++) {
          const novoVencimento = new Date(ultimaParcela.vencimento);
          novoVencimento.setMonth(novoVencimento.getMonth() + i + 1);

          const novaParcela = await prisma.conta.create({
            data: {
              descricao: descricao || primeiraParcela.descricao,
              valor: novoValorParcela,
              vencimento: novoVencimento,
              pago: false,
              status: 'pendente',
              tipo: primeiraParcela.tipo,
              numeroParcela: `${quantidadeAnterior + i + 1}/${novaQuantidade}`,
              totalParcelas: novaQuantidade,
              grupoParcelamentoId: grupoParcelamentoId,
              parentId: contaMacro?.id || primeiraParcela.parentId,
              beneficiario: beneficiario || primeiraParcela.beneficiario,
              codigoTipo: codigoTipo || primeiraParcela.codigoTipo,
              cartaoId: primeiraParcela.cartaoId,
              bancoContaId: primeiraParcela.bancoContaId,
              socioResponsavelId: socioIdFromCentro || primeiraParcela.socioResponsavelId,
              userId: user.id,
              empresaId: empresaId || undefined,
            }
          });
          parcelasCriadas++;

          if (cartaoIdParaRecalcular) {
            mesesParaRecalcular.add(`${novoVencimento.getFullYear()}-${novoVencimento.getMonth() + 1}`);
          }
        }

        console.log(`   ✅ ${parcelasParaAdicionar} parcelas criadas com valor R$ ${novoValorParcela.toFixed(2)}`);

      } else if (novaQuantidade < quantidadeAnterior) {
        // REMOVER PARCELAS (apenas pendentes, do final)
        const parcelasParaRemover = quantidadeAnterior - novaQuantidade;

        // Ordenar parcelas: pendentes primeiro (do final), pagas depois
        const parcelasOrdenadas = [...todasParcelas].sort((a, b) => {
          // Primeiro critério: pendentes antes de pagas
          if (a.pago !== b.pago) return a.pago ? 1 : -1;
          // Segundo critério: maior vencimento primeiro (para remover do final)
          return new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime();
        });

        // Contar parcelas pendentes disponíveis para remoção
        const parcelasPendentes = parcelasOrdenadas.filter(p => !p.pago);

        if (parcelasPendentes.length < parcelasParaRemover) {
          return NextResponse.json({
            error: `Não é possível reduzir para ${novaQuantidade} parcelas. Existem apenas ${parcelasPendentes.length} parcelas pendentes que podem ser removidas.`,
            parcelasPagas: todasParcelas.filter((p: any) => p.pago).length
          }, { status: 400 });
        }

        console.log(`   ➖ Removendo ${parcelasParaRemover} parcelas pendentes`);

        // Remover parcelas pendentes do final
        for (let i = 0; i < parcelasParaRemover; i++) {
          const parcelaRemover = parcelasPendentes[i];

          if (cartaoIdParaRecalcular && parcelaRemover.vencimento) {
            const dataVencimento = new Date(parcelaRemover.vencimento);
            mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
          }

          await prisma.conta.delete({ where: { id: parcelaRemover.id } });
          parcelasRemovidas++;
        }

        // Recalcular valor das parcelas restantes
        const novoValorParcela = valorTotalAtual / novaQuantidade;
        const parcelasRestantes = await prisma.conta.findMany({
          where: { ...where, isContaMacro: false },
          orderBy: { vencimento: 'asc' }
        });

        for (const parcela of parcelasRestantes) {
          await prisma.conta.update({
            where: { id: parcela.id },
            data: { valor: novoValorParcela }
          });

          if (cartaoIdParaRecalcular && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
          }
        }

        console.log(`   ✅ ${parcelasRemovidas} parcelas removidas, restantes atualizadas para R$ ${novoValorParcela.toFixed(2)}`);
      }

      // Atualizar a conta macro se existir
      if (contaMacro) {
        await prisma.conta.update({
          where: { id: contaMacro.id },
          data: { totalParcelas: novaQuantidade }
        });
      }

      // Atualizar lista de parcelas
      todasParcelas = await prisma.conta.findMany({
        where: { ...where, isContaMacro: false },
        orderBy: { vencimento: 'asc' }
      });
    }

    // ========================================
    // ATUALIZAR DADOS GERAIS EM TODAS AS PARCELAS
    // ========================================
    const dadosGerais: any = {};
    if (descricao !== undefined) dadosGerais.descricao = descricao;
    if (beneficiario !== undefined) dadosGerais.beneficiario = beneficiario || null;
    if (codigoTipo !== undefined) dadosGerais.codigoTipo = codigoTipo || null;
    if (socioIdFromCentro) dadosGerais.socioResponsavelId = socioIdFromCentro;
    dadosGerais.totalParcelas = totalParcelas;

    if (Object.keys(dadosGerais).length > 1) { // Mais que apenas totalParcelas
      await prisma.conta.updateMany({
        where: { grupoParcelamentoId, userId: user.id, isContaMacro: false },
        data: dadosGerais
      });

      // Atualizar conta macro também
      if (contaMacro) {
        await prisma.conta.update({
          where: { id: contaMacro.id },
          data: dadosGerais
        });
      }

      console.log(`   ✅ Dados gerais atualizados em ${todasParcelas.length} parcelas`);
    }

    // Processar parcelas atualizadas
    if (parcelasAtualizadas && Array.isArray(parcelasAtualizadas)) {
      // IDs das parcelas que devem existir após a atualização
      const idsParcelasRecebidas = new Set<number>();

      for (let i = 0; i < parcelasAtualizadas.length; i++) {
        const parcelaData = parcelasAtualizadas[i];
        const numeroParcela = parcelaData.numeroParcela || `${i + 1}/${totalParcelas}`;

        if (parcelaData.id && parcelaData.id > 0) {
          // Atualizar parcela existente (paga OU pendente)
          const parcelaExistente = todasParcelas.find((p: any) => p.id === parcelaData.id);

          if (parcelaExistente) {
            idsParcelasRecebidas.add(parcelaData.id);

            // Verificar mudanças
            const mudouStatus = parcelaExistente.pago !== parcelaData.pago;
            const mudouValor = parcelaExistente.valor !== Number(parcelaData.valor);

            // Atualizar a parcela
            await prisma.conta.update({
              where: { id: parcelaData.id },
              data: {
                valor: Number(parcelaData.valor),
                vencimento: parseLocalDate(parcelaData.vencimento),
                numeroParcela: numeroParcela,
                pago: parcelaData.pago,
                dataPagamento: parcelaData.pago ? parseLocalDate(parcelaData.dataPagamento) : null,
                status: parcelaData.pago ? 'pago' : 'pendente',
                noFluxoCaixa: parcelaData.pago
              }
            });
            parcelasModificadas++;

            // Atualizar fluxo de caixa se status mudou
            if (mudouStatus) {
              await atualizarFluxoCaixa(parcelaData, parcelaExistente, user.id, empresaId);
            }

            // Marcar mês para recalcular fatura se valor mudou e tem cartão
            if (mudouValor && cartaoIdParaRecalcular) {
              const dataVencimento = parseLocalDate(parcelaData.vencimento);
              mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
            }
          }
        } else {
          // Criar nova parcela
          const primeiraParcela = todasParcelas[0];

          const novaParcela = await prisma.conta.create({
            data: {
              descricao: descricao || primeiraParcela.descricao,
              valor: Number(parcelaData.valor),
              vencimento: parseLocalDate(parcelaData.vencimento),
              pago: parcelaData.pago || false,
              dataPagamento: parcelaData.pago ? parseLocalDate(parcelaData.dataPagamento) : null,
              status: parcelaData.pago ? 'pago' : 'pendente',
              noFluxoCaixa: parcelaData.pago || false,
              tipo: primeiraParcela.tipo,
              numeroParcela: numeroParcela,
              totalParcelas: totalParcelas,
              grupoParcelamentoId: grupoParcelamentoId,
              parentId: contaMacro?.id || primeiraParcela.parentId, // Vincular à conta macro
              beneficiario: beneficiario || primeiraParcela.beneficiario,
              codigoTipo: codigoTipo || primeiraParcela.codigoTipo,
              cartaoId: primeiraParcela.cartaoId,
              bancoContaId: primeiraParcela.bancoContaId,
              socioResponsavelId: socioIdFromCentro || primeiraParcela.socioResponsavelId,
              userId: user.id,
              empresaId: empresaId || undefined,
            }
          });
          parcelasCriadas++;

          // Se nova parcela já está paga, criar fluxo de caixa
          if (parcelaData.pago) {
            await atualizarFluxoCaixa(
              { ...parcelaData, pago: true },
              { ...novaParcela, pago: false },
              user.id,
              empresaId
            );
          }

          // Marcar mês para recalcular fatura se tem cartão
          if (cartaoIdParaRecalcular) {
            const dataVencimento = parseLocalDate(parcelaData.vencimento);
            mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
          }
        }
      }

      // Remover parcelas que não estão mais na lista
      for (const parcela of todasParcelas) {
        if (!idsParcelasRecebidas.has(parcela.id)) {
          // Se estava paga, remover do fluxo de caixa primeiro
          if (parcela.pago) {
            await prisma.fluxoCaixa.deleteMany({
              where: { contaId: parcela.id }
            });
          }

          await prisma.conta.delete({ where: { id: parcela.id } });
          parcelasRemovidas++;

          // Marcar mês para recalcular fatura se tem cartão
          if (cartaoIdParaRecalcular && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            mesesParaRecalcular.add(`${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`);
          }
        }
      }
    }

    // Recalcular faturas de cartão afetadas
    if (cartaoIdParaRecalcular && mesesParaRecalcular.size > 0) {
      for (const mesAno of mesesParaRecalcular) {
        const [ano, mes] = mesAno.split('-').map(Number);
        await recalcularFaturaCartao(
          cartaoIdParaRecalcular,
          new Date(ano, mes - 1, 15),
          user.id,
          empresaId
        );
      }
    }

    // Atualizar numeroParcela de todas as parcelas restantes (excluindo macro)
    const parcelasFinais = await prisma.conta.findMany({
      where: { grupoParcelamentoId, userId: user.id, isContaMacro: false },
      orderBy: { vencimento: 'asc' }
    });

    // Detectar primeira parcela para valor_parcela
    let primeiraParcelaNumero = 1;
    if (tipoParcelamento === "valor_parcela" && parcelasFinais.length > 0) {
      const primeiraParcela = parcelasFinais[0];
      if (primeiraParcela.numeroParcela) {
        const match = primeiraParcela.numeroParcela.match(/^(\d+)\/\d+$/);
        if (match) {
          primeiraParcelaNumero = parseInt(match[1]);
        }
      }
    }

    for (let i = 0; i < parcelasFinais.length; i++) {
      let novoNumeroParcela: string;

      // Respeitar o tipo de parcelamento ao atualizar numeroParcela
      if (tipoParcelamento === "valor_parcela") {
        // Para valor_parcela, manter o número original da primeira parcela
        novoNumeroParcela = `${primeiraParcelaNumero + i}/${primeiraParcelaNumero + parcelasFinais.length - 1}`;
      } else {
        // Para valor_total e avista, sempre começar de 1
        novoNumeroParcela = `${i + 1}/${parcelasFinais.length}`;
      }

      await prisma.conta.update({
        where: { id: parcelasFinais[i].id },
        data: {
          numeroParcela: novoNumeroParcela,
          totalParcelas: parcelasFinais.length
        }
      });
    }

    // Calcular valor total final
    const valorTotalNovo = parcelasFinais.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const diferencaValor = valorTotalNovo - valorTotalAnterior;

    // Atualizar conta macro com valor total final
    if (contaMacro) {
      await prisma.conta.update({
        where: { id: contaMacro.id },
        data: {
          valor: valorTotalNovo,
          valorTotal: valorTotalNovo,
          totalParcelas: parcelasFinais.length
        }
      });
      console.log(`   ✅ Conta macro atualizada: R$ ${valorTotalNovo.toFixed(2)}, ${parcelasFinais.length} parcelas`);
    }

    // Atualizar centro de custo se houve diferença de valor
    if (diferencaValor !== 0 && codigoTipo) {
      await atualizarCentroCusto(codigoTipo, diferencaValor, user.id, empresaId);
    }

    console.log(`✅ Parcelamento atualizado:`);
    console.log(`   - ${parcelasModificadas} parcelas modificadas`);
    console.log(`   - ${parcelasCriadas} parcelas criadas`);
    console.log(`   - ${parcelasRemovidas} parcelas removidas`);
    console.log(`   - Valor total: R$ ${valorTotalAnterior.toFixed(2)} → R$ ${valorTotalNovo.toFixed(2)}`);

    // ========================================
    // SALVAR HISTÓRICO SE HOUVE ALTERAÇÃO
    // ========================================
    if (alteracaoDetectada) {
      await salvarHistoricoParcelamento(
        grupoParcelamentoId,
        contaMacro?.id || null,
        alteracaoDetectada.tipo,
        alteracaoDetectada.descricao,
        snapshotAnterior,
        valorTotalNovo,
        parcelasFinais.length,
        user.id,
        empresaId
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Parcelamento atualizado com sucesso',
      contaMacro: contaMacro ? { id: contaMacro.id, valorTotal: valorTotalNovo, totalParcelas: parcelasFinais.length } : null,
      stats: {
        modificadas: parcelasModificadas,
        criadas: parcelasCriadas,
        removidas: parcelasRemovidas,
        total: parcelasFinais.length,
        valorTotal: valorTotalNovo
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar parcelamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar parcelamento' },
      { status: 500 }
    );
  }
}
