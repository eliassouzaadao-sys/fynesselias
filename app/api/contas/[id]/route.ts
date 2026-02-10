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
import { atualizarContaProLabore } from '@/lib/prolabore';

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
        parcelas: {
          orderBy: { vencimento: 'asc' }
        },
        cartao: {
          select: { id: true, nome: true, bandeira: true, ultimos4Digitos: true }
        },
        bancoConta: {
          select: { id: true, nome: true, codigo: true }
        },
        parent: {
          select: { id: true, descricao: true, valorTotal: true, totalParcelas: true }
        }
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
    if (data.valorPago !== undefined) updateData.valorPago = Number(data.valorPago);
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

    // Se o valor foi alterado, atualizar pró-labore do sócio vinculado
    if (data.valor !== undefined && Number(data.valor) !== Number(existingConta.valor)) {
      if (contaAtualizada.socioResponsavelId) {
        console.log('📊 Valor da conta alterado, atualizando pró-labore do sócio...');
        await atualizarContaProLabore(contaAtualizada.socioResponsavelId, user.id, empresaId);
      } else if (contaAtualizada.codigoTipo) {
        // Verificar se o codigoTipo pertence a um sócio
        const whereCentro: any = { sigla: contaAtualizada.codigoTipo, userId: user.id };
        if (empresaId) whereCentro.empresaId = empresaId;
        const centro = await prisma.centroCusto.findFirst({
          where: whereCentro,
          select: { id: true, isSocio: true }
        });
        if (centro && centro.isSocio) {
          console.log('📊 Valor da conta alterado, atualizando pró-labore pelo codigoTipo...');
          await atualizarContaProLabore(centro.id, user.id, empresaId);
        }
      }
    }

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
 * Se for conta macro, exclui todas as parcelas filhas primeiro
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
      include: {
        parcelas: true, // Buscar parcelas filhas
      }
    });

    if (!existingConta) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    let parcelasExcluidas = 0;
    let fluxosExcluidos = 0;
    const faturasParaRecalcular = new Set<number>(); // IDs de faturas que precisam ser recalculadas

    // Se for conta macro ou tiver parcelas filhas, excluir elas primeiro
    if (existingConta.isContaMacro || (existingConta.parcelas && existingConta.parcelas.length > 0)) {
      console.log(`🗑️ Excluindo conta macro ID ${id} com ${existingConta.parcelas?.length || 0} parcelas`);

      // Buscar todas as parcelas filhas (via parentId ou grupoParcelamentoId)
      const parcelasFilhas = await prisma.conta.findMany({
        where: {
          OR: [
            { parentId: id },
            existingConta.grupoParcelamentoId
              ? { grupoParcelamentoId: existingConta.grupoParcelamentoId, id: { not: id } }
              : { id: -1 } // Condição falsa se não há grupoParcelamentoId
          ],
          userId: user.id,
        },
        select: { id: true, pago: true, cartaoId: true, vencimento: true }
      });

      console.log(`   Encontradas ${parcelasFilhas.length} parcelas filhas`);

      // Coletar faturas afetadas pelas parcelas
      for (const parcela of parcelasFilhas) {
        if (parcela.cartaoId) {
          const mesVencimento = new Date(parcela.vencimento).getMonth() + 1;
          const anoVencimento = new Date(parcela.vencimento).getFullYear();

          const faturaWhere: any = {
            cartaoId: parcela.cartaoId,
            mesReferencia: mesVencimento,
            anoReferencia: anoVencimento,
            userId: user.id
          };
          if (empresaId) faturaWhere.empresaId = empresaId;

          const fatura = await prisma.fatura.findFirst({
            where: faturaWhere,
            select: { id: true }
          });

          if (fatura) {
            faturasParaRecalcular.add(fatura.id);
          }
        }

        // Excluir fluxo de caixa das parcelas pagas
        if (parcela.pago) {
          const deleted = await prisma.fluxoCaixa.deleteMany({
            where: { contaId: parcela.id }
          });
          fluxosExcluidos += deleted.count;
        }
      }

      // Excluir todas as parcelas filhas
      const deleteResult = await prisma.conta.deleteMany({
        where: {
          OR: [
            { parentId: id },
            existingConta.grupoParcelamentoId
              ? { grupoParcelamentoId: existingConta.grupoParcelamentoId, id: { not: id } }
              : { id: -1 }
          ],
          userId: user.id,
        }
      });
      parcelasExcluidas = deleteResult.count;

      console.log(`   ✅ ${parcelasExcluidas} parcelas excluídas, ${fluxosExcluidos} registros de fluxo removidos`);
    }

    // Excluir fluxo de caixa da própria conta (se foi paga)
    if (existingConta.pago) {
      await prisma.fluxoCaixa.deleteMany({
        where: { contaId: id }
      });
    }

    // Guardar referências do sócio e cartão ANTES de deletar a conta
    const socioResponsavelId = existingConta.socioResponsavelId;
    const codigoTipo = existingConta.codigoTipo;
    const cartaoId = existingConta.cartaoId;
    const mesVencimento = new Date(existingConta.vencimento).getMonth() + 1;
    const anoVencimento = new Date(existingConta.vencimento).getFullYear();

    // Excluir a conta
    await prisma.conta.delete({
      where: { id },
    });

    // Se a conta estava vinculada a um cartão, adicionar sua fatura à lista
    if (cartaoId) {
      const faturaWhere: any = {
        cartaoId,
        mesReferencia: mesVencimento,
        anoReferencia: anoVencimento,
        userId: user.id
      };
      if (empresaId) faturaWhere.empresaId = empresaId;

      const fatura = await prisma.fatura.findFirst({
        where: faturaWhere,
        select: { id: true }
      });

      if (fatura) {
        faturasParaRecalcular.add(fatura.id);
      }
    }

    // Recalcular todas as faturas afetadas
    if (faturasParaRecalcular.size > 0) {
      console.log(`💳 Recalculando ${faturasParaRecalcular.size} fatura(s)...`);

      for (const faturaId of faturasParaRecalcular) {
        const fatura = await prisma.fatura.findUnique({
          where: { id: faturaId },
          select: { id: true, cartaoId: true, mesReferencia: true, anoReferencia: true }
        });

        if (fatura) {
          const inicioMes = new Date(fatura.anoReferencia, fatura.mesReferencia - 1, 1, 0, 0, 0);
          const fimMes = new Date(fatura.anoReferencia, fatura.mesReferencia, 0, 23, 59, 59);

          const contasFaturaWhere: any = {
            userId: user.id,
            cartaoId: fatura.cartaoId,
            vencimento: {
              gte: inicioMes,
              lte: fimMes
            },
            OR: [
              { totalParcelas: null },
              { parentId: { not: null } },
            ]
          };
          if (empresaId) contasFaturaWhere.empresaId = empresaId;

          const contasRestantes = await prisma.conta.findMany({
            where: contasFaturaWhere,
            select: { valor: true }
          });

          const novoValorTotal = contasRestantes.reduce((acc, conta) => acc + conta.valor, 0);

          await prisma.fatura.update({
            where: { id: fatura.id },
            data: { valorTotal: novoValorTotal }
          });

          console.log(`   ✅ Fatura ${fatura.id}: ${novoValorTotal.toFixed(2)}`);
        }
      }
    }

    // Atualizar pró-labore do sócio vinculado (após a exclusão)
    if (socioResponsavelId) {
      console.log('📊 Conta excluída tinha socioResponsavelId, atualizando pró-labore...');
      await atualizarContaProLabore(socioResponsavelId, user.id, empresaId);
    } else if (codigoTipo) {
      // Verificar se o codigoTipo pertence a um sócio
      const whereCentro: any = { sigla: codigoTipo, userId: user.id };
      if (empresaId) whereCentro.empresaId = empresaId;
      const centro = await prisma.centroCusto.findFirst({
        where: whereCentro,
        select: { id: true, isSocio: true }
      });
      if (centro && centro.isSocio) {
        console.log('📊 Conta excluída vinculada a sócio pelo codigoTipo, atualizando pró-labore...');
        await atualizarContaProLabore(centro.id, user.id, empresaId);
      }
    }

    const message = parcelasExcluidas > 0
      ? `Conta macro e ${parcelasExcluidas} parcelas excluídas com sucesso`
      : 'Conta deletada com sucesso';

    return NextResponse.json({
      success: true,
      message,
      parcelasExcluidas,
      fluxosExcluidos
    });
  } catch (error) {
    console.error('Error deleting conta:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar conta' },
      { status: 500 }
    );
  }
}
