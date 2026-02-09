import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';
import { atualizarContaProLabore } from '@/lib/prolabore';

// Função auxiliar para buscar socioResponsavelId pelo centro de custo
async function getSocioIdByCentroCusto(sigla, userId, empresaId = null) {
  if (!sigla || !userId) return null;

  try {
    const where = { sigla, userId };
    if (empresaId) where.empresaId = empresaId;

    const centro = await prisma.centroCusto.findFirst({
      where,
      select: { id: true, isSocio: true }
    });

    if (centro && centro.isSocio) {
      console.log(`👤 Centro ${sigla} é sócio, vinculando socioResponsavelId: ${centro.id}`);
      return centro.id;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar sócio pelo centro de custo:', error);
    return null;
  }
}

// Função auxiliar para atualizar centro de custo e propagar para o pai
async function updateCentroAndParent(sigla, field, increment, userId) {
  if (!sigla || !userId) return;

  try {
    // Buscar o centro
    const centro = await prisma.centroCusto.findFirst({
      where: { sigla, userId },
      include: { parent: true },
    });

    if (!centro) return;

    // Atualizar o centro atual
    await prisma.centroCusto.update({
      where: { id: centro.id },
      data: {
        [field]: {
          increment: increment,
        },
      },
    });

    // Se tem pai, atualizar o pai também
    if (centro.parentId) {
      await prisma.centroCusto.update({
        where: { id: centro.parentId },
        data: {
          [field]: {
            increment: increment,
          },
        },
      });
    }
  } catch (error) {
    console.error(`Error updating centro ${sigla} and parent:`, error);
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const where = { userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const fluxoCaixa = await prisma.fluxoCaixa.findMany({
      where,
      orderBy: { dia: 'desc' },
      include: {
        conta: {
          include: {
            pessoa: true,
            parcelas: { select: { id: true } }, // Incluir parcelas para detectar macros
          },
        },
        banco: true,
        cartao: true,
      },
    });

    // Filtrar registros de contas macro (elas NUNCA devem aparecer no fluxo)
    // Verifica tanto a flag isContaMacro quanto se a conta tem parcelas filhas (para dados antigos)
    const fluxosParaRemover = [];
    const fluxoFiltrado = fluxoCaixa.filter(f => {
      if (!f.conta) return true; // Manter fluxos sem conta vinculada (lançamentos diretos)

      // Verificar se é uma conta macro (pelo flag ou por ter parcelas filhas)
      const isMacro = f.conta.isContaMacro ||
        (f.conta.parcelas && f.conta.parcelas.length > 0 && !f.conta.parentId);

      if (isMacro) {
        console.log(`🚫 Detectado fluxo de macro (será removido): ID ${f.id}, contaId: ${f.contaId}, valor: ${f.valor}`);
        fluxosParaRemover.push(f.id);
        return false;
      }
      return true;
    });

    // Limpeza automática: remover fluxos de macros que existem no banco (dados antigos/corrompidos)
    if (fluxosParaRemover.length > 0) {
      console.log(`🧹 Removendo ${fluxosParaRemover.length} fluxos de macro do banco de dados...`);
      try {
        await prisma.fluxoCaixa.deleteMany({
          where: {
            id: { in: fluxosParaRemover },
            userId: user.id,
          }
        });
        console.log(`✅ ${fluxosParaRemover.length} fluxos de macro removidos com sucesso`);
      } catch (cleanupError) {
        console.error('Erro ao limpar fluxos de macro:', cleanupError);
      }
    }

    return NextResponse.json(Array.isArray(fluxoFiltrado) ? fluxoFiltrado : []);
  } catch (error) {
    console.error('Error fetching fluxo de caixa:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();

    // Buscar o último fluxo para calcular o novo saldo
    const whereUltimoFluxo = { userId: user.id };
    if (empresaId) whereUltimoFluxo.empresaId = empresaId;

    const ultimoFluxo = await prisma.fluxoCaixa.findFirst({
      where: whereUltimoFluxo,
      orderBy: { dia: 'desc' },
    });

    const saldoAnterior = ultimoFluxo?.fluxo || 0;
    const novoFluxo = data.tipo === 'entrada'
      ? saldoAnterior + Number(data.valor)
      : saldoAnterior - Number(data.valor);

    // Verificar se o centro de custo é um sócio
    const socioId = await getSocioIdByCentroCusto(data.centroCustoSigla, user.id, empresaId);
    const contaId = data.contaId || null;

    // Se tem contaId, verificar se é conta macro (não pode criar fluxo para macro)
    if (contaId) {
      const conta = await prisma.conta.findUnique({
        where: { id: contaId },
        select: {
          isContaMacro: true,
          parentId: true,
          parcelas: { select: { id: true }, take: 1 } // Verificar se tem filhos
        }
      });

      // Bloquear se é macro (pelo flag ou por ter parcelas filhas sem ser filho de outra conta)
      const isMacro = conta?.isContaMacro ||
        (conta?.parcelas && conta.parcelas.length > 0 && !conta.parentId);

      if (isMacro) {
        console.log(`🚫 Tentativa de criar fluxo para conta macro bloqueada: contaId=${contaId}`);
        return NextResponse.json(
          { error: 'Não é permitido criar fluxo de caixa para conta macro. Use as parcelas individuais.' },
          { status: 400 }
        );
      }
    }

    // Criar registro no fluxo de caixa
    const novoRegistro = await prisma.fluxoCaixa.create({
      data: {
        dia: new Date(data.dia),
        codigoTipo: data.codigoTipo,
        fornecedorCliente: data.fornecedorCliente,
        descricao: data.descricao || null,
        valor: Number(data.valor),
        tipo: data.tipo,
        fluxo: novoFluxo,
        centroCustoSigla: data.centroCustoSigla,
        contaId: contaId,
        bancoId: data.bancoId || null,
        cartaoId: data.cartaoId || null,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });

    // Se for sócio e for saída SEM conta associada (lançamento direto), atualizar descontoReal
    // Se tiver contaId, a conta será contada na query de contas pagas, então não precisa duplicar aqui
    if (socioId && data.tipo === 'saida' && !contaId) {
      await prisma.centroCusto.update({
        where: { id: socioId },
        data: {
          descontoReal: {
            increment: Number(data.valor),
          },
        },
      });
      console.log(`💰 Desconto real do sócio ${socioId} atualizado (lançamento direto): +${data.valor}`);

      // Atualizar conta de pró-labore do sócio
      await atualizarContaProLabore(socioId, user.id, empresaId);
    }
    // Se não for sócio e tiver centro de custo, atualizar o realizado do centro
    else if (data.centroCustoSigla && !socioId) {
      await updateCentroAndParent(data.centroCustoSigla, 'realizado', Number(data.valor), user.id);
    }

    return NextResponse.json(novoRegistro);
  } catch (error) {
    console.error('Error creating fluxo de caixa:', error);
    return NextResponse.json(
      { error: 'Failed to create fluxo de caixa' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar movimentação (banco, fornecedor, valor, data, etc)
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID da movimentacao e obrigatorio' },
        { status: 400 }
      );
    }

    // Verificar se pertence ao usuário
    const whereExisting = { id: data.id, userId: user.id };
    if (empresaId) whereExisting.empresaId = empresaId;

    const existing = await prisma.fluxoCaixa.findFirst({
      where: whereExisting,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Movimentação não encontrada' },
        { status: 404 }
      );
    }

    // Construir objeto de atualização
    const updateData = {};
    if (data.bancoId !== undefined) updateData.bancoId = data.bancoId || null;
    if (data.fornecedorCliente !== undefined) updateData.fornecedorCliente = data.fornecedorCliente;
    if (data.descricao !== undefined) updateData.descricao = data.descricao || null;
    if (data.codigoTipo !== undefined) {
      updateData.codigoTipo = data.codigoTipo;
      updateData.centroCustoSigla = data.codigoTipo;
    }
    if (data.valor !== undefined) updateData.valor = Number(data.valor);
    if (data.dia !== undefined) updateData.dia = new Date(data.dia);

    const fluxoAtualizado = await prisma.fluxoCaixa.update({
      where: { id: data.id },
      data: updateData,
      include: {
        banco: true,
        conta: true,
      },
    });

    // Se o valor mudou, recalcular todos os saldos
    if (data.valor !== undefined && data.valor !== existing.valor) {
      const whereTodosFluxos = { userId: user.id };
      if (empresaId) whereTodosFluxos.empresaId = empresaId;

      const todosFluxos = await prisma.fluxoCaixa.findMany({
        where: whereTodosFluxos,
        orderBy: { dia: 'asc' },
      });

      let saldoAcumulado = 0;
      for (const f of todosFluxos) {
        if (f.tipo === 'entrada') {
          saldoAcumulado += Number(f.valor);
        } else {
          saldoAcumulado -= Number(f.valor);
        }
        await prisma.fluxoCaixa.update({
          where: { id: f.id },
          data: { fluxo: saldoAcumulado },
        });
      }

      // Se é lançamento de sócio e o valor mudou, atualizar pró-labore
      if (existing.centroCustoSigla && existing.tipo === 'saida') {
        const socioId = await getSocioIdByCentroCusto(existing.centroCustoSigla, user.id, empresaId);
        if (socioId) {
          // Se for lançamento direto (sem contaId), atualizar descontoReal com a diferença
          if (!existing.contaId) {
            const diferenca = Number(data.valor) - Number(existing.valor);
            await prisma.centroCusto.update({
              where: { id: socioId },
              data: {
                descontoReal: {
                  increment: diferenca,
                },
              },
            });
            console.log(`💰 Desconto real do sócio ${socioId} ajustado: ${diferenca > 0 ? '+' : ''}${diferenca}`);
          }

          // Atualizar conta de pró-labore (tanto para lançamento direto quanto vinculado a conta)
          console.log(`📊 Atualizando pró-labore do sócio ${socioId} após edição de valor no fluxo...`);
          await atualizarContaProLabore(socioId, user.id, empresaId);
        }
      }
    }

    return NextResponse.json(fluxoAtualizado);
  } catch (error) {
    console.error('Error updating fluxo de caixa:', error);
    return NextResponse.json(
      { error: 'Failed to update fluxo de caixa' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir movimentação (permite excluir lançamentos pagos, revertendo a conta)
export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID da movimentacao e obrigatorio' },
        { status: 400 }
      );
    }

    // Buscar a movimentação (verificando se pertence ao usuário)
    const whereFluxo = { id: data.id, userId: user.id };
    if (empresaId) whereFluxo.empresaId = empresaId;

    const fluxo = await prisma.fluxoCaixa.findFirst({
      where: whereFluxo,
      include: {
        conta: {
          select: {
            id: true,
            socioResponsavelId: true,
            codigoTipo: true,
            pago: true,
          },
        },
      },
    });

    if (!fluxo) {
      return NextResponse.json(
        { error: 'Movimentacao nao encontrada' },
        { status: 404 }
      );
    }

    // Guardar referência do sócio da conta vinculada ANTES de reverter
    let socioIdDaConta = null;
    if (fluxo.contaId && fluxo.conta) {
      // Verificar se a conta tem sócio vinculado
      if (fluxo.conta.socioResponsavelId) {
        socioIdDaConta = fluxo.conta.socioResponsavelId;
      } else if (fluxo.conta.codigoTipo) {
        // Verificar pelo codigoTipo
        socioIdDaConta = await getSocioIdByCentroCusto(fluxo.conta.codigoTipo, user.id, empresaId);
      }

      console.log(`🔄 Revertendo conta ${fluxo.contaId} para status pendente... (socioIdDaConta: ${socioIdDaConta})`);
      await prisma.conta.update({
        where: { id: fluxo.contaId },
        data: {
          pago: false,
          dataPagamento: null,
          noFluxoCaixa: false,
          status: 'pendente',
        },
      });
      console.log(`✅ Conta ${fluxo.contaId} revertida para pendente`);
    }

    // Guardar informações necessárias ANTES de excluir
    let socioIdParaAtualizar = null;

    if (fluxo.centroCustoSigla) {
      const socioId = await getSocioIdByCentroCusto(fluxo.centroCustoSigla, user.id, empresaId);

      if (socioId && fluxo.tipo === 'saida') {
        socioIdParaAtualizar = socioId;

        // Se for lançamento direto (sem contaId), reverter o descontoReal
        if (!fluxo.contaId) {
          await prisma.centroCusto.update({
            where: { id: socioId },
            data: {
              descontoReal: {
                decrement: Number(fluxo.valor),
              },
            },
          });
          console.log(`💰 Desconto real do sócio ${socioId} revertido (lançamento direto): -${fluxo.valor}`);
        }
      } else if (!socioId && fluxo.centroCustoSigla) {
        // Se não for sócio, reverter o realizado
        await updateCentroAndParent(fluxo.centroCustoSigla, 'realizado', -Number(fluxo.valor), user.id);
      }
    }

    // Se a conta tinha sócio vinculado, guardar para atualizar depois
    if (socioIdDaConta && !socioIdParaAtualizar) {
      socioIdParaAtualizar = socioIdDaConta;
    }

    // PRIMEIRO: Excluir a movimentação (ANTES de atualizar pró-labore)
    await prisma.fluxoCaixa.delete({
      where: { id: data.id },
    });
    console.log(`✅ Movimentação ${data.id} excluída`);

    // DEPOIS: Atualizar pró-labore (agora o lançamento não existe mais)
    if (socioIdParaAtualizar) {
      console.log(`📊 Atualizando pró-labore do sócio ${socioIdParaAtualizar} após exclusão no fluxo...`);
      await atualizarContaProLabore(socioIdParaAtualizar, user.id, empresaId);
    }

    // Recalcular todos os saldos (fluxo) após a exclusão
    const whereTodosFluxos = { userId: user.id };
    if (empresaId) whereTodosFluxos.empresaId = empresaId;

    const todosFluxos = await prisma.fluxoCaixa.findMany({
      where: whereTodosFluxos,
      orderBy: { dia: 'asc' },
    });

    let saldoAcumulado = 0;
    for (const f of todosFluxos) {
      if (f.tipo === 'entrada') {
        saldoAcumulado += Number(f.valor);
      } else {
        saldoAcumulado -= Number(f.valor);
      }
      await prisma.fluxoCaixa.update({
        where: { id: f.id },
        data: { fluxo: saldoAcumulado },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fluxo de caixa:', error);
    return NextResponse.json(
      { error: 'Failed to delete fluxo de caixa' },
      { status: 500 }
    );
  }
}
