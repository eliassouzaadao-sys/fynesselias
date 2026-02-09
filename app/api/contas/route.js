import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// Função auxiliar para atualizar centro de custo e propagar recursivamente para todos os ancestrais
async function updateCentroAndParent(sigla, field, increment, userId) {
  if (!sigla || !userId) {
    console.log('updateCentroAndParent: sigla ou userId nao fornecidos');
    return;
  }

  try {
    console.log(`Buscando centro com sigla: ${sigla} para usuário ${userId}`);

    // Buscar o centro
    const centro = await prisma.centroCusto.findFirst({
      where: { sigla, userId },
    });

    if (!centro) {
      console.log(`Centro nao encontrado: ${sigla}`);
      return;
    }

    console.log(`Centro encontrado: ${centro.nome} (ID: ${centro.id})`);

    // Atualizar o centro atual
    await prisma.centroCusto.update({
      where: { id: centro.id },
      data: {
        [field]: {
          increment: increment,
        },
      },
    });

    console.log(`Centro ${sigla} atualizado: ${field} += ${increment}`);

    // Propagar recursivamente para todos os ancestrais
    await propagateToAncestors(centro.parentId, field, increment, userId);
  } catch (error) {
    console.error(`Error updating centro ${sigla} and parent:`, error);
  }
}

// Função recursiva para propagar valores para todos os centros ancestrais
async function propagateToAncestors(parentId, field, increment, userId) {
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

    console.log(`Centro pai ${parent.nome} (${parent.sigla}) atualizado: ${field} += ${increment}`);

    // Continuar propagando para o próximo ancestral
    if (parent.parentId) {
      await propagateToAncestors(parent.parentId, field, increment, userId);
    }
  } catch (error) {
    console.error(`Error propagating to parent ${parentId}:`, error);
  }
}

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

// Função auxiliar para criar/atualizar fatura do cartão de crédito
async function atualizarFaturaCartao(conta, cartaoId, userId, empresaId = null) {
  try {
    // Buscar o cartão
    const cartao = await prisma.cartaoCredito.findUnique({
      where: { id: Number(cartaoId) },
    });

    if (!cartao) {
      console.log('⚠️ Cartão não encontrado:', cartaoId);
      return;
    }

    // Calcular qual fatura a conta pertence
    // A fatura é referenciada pelo mês de USO (quando a compra foi feita)
    // Ex: compra em 9/fev = Fatura de Fevereiro (mesmo que vença em março)
    const dataVencimento = new Date(conta.vencimento);
    const mes = dataVencimento.getMonth() + 1; // 1-12 (mês de uso)
    const ano = dataVencimento.getFullYear();

    console.log('💳 Calculando fatura:', { cartaoId, mes, ano, diaFechamento: cartao.diaFechamento, userId, empresaId });

    // Verificar se a fatura já existe
    let fatura = await prisma.fatura.findUnique({
      where: {
        cartaoId_mesReferencia_anoReferencia: {
          cartaoId: Number(cartaoId),
          mesReferencia: mes,
          anoReferencia: ano,
        },
      },
    });

    // Se não existe, criar
    if (!fatura) {
      // Calcular datas de fechamento e vencimento da fatura
      // O fechamento e vencimento são no mês SEGUINTE ao mês de uso
      let mesFechamento = mes + 1;
      let anoFechamento = ano;
      if (mesFechamento > 12) {
        mesFechamento = 1;
        anoFechamento += 1;
      }
      const dataFechamento = new Date(anoFechamento, mesFechamento - 1, cartao.diaFechamento, 12, 0, 0);
      const dataVencimentoFatura = new Date(anoFechamento, mesFechamento - 1, cartao.diaVencimento, 12, 0, 0);

      fatura = await prisma.fatura.create({
        data: {
          cartaoId: Number(cartaoId),
          mesReferencia: mes,
          anoReferencia: ano,
          valorTotal: Number(conta.valor),
          dataFechamento,
          dataVencimento: dataVencimentoFatura,
          userId: userId,
          empresaId: empresaId || undefined,
        },
      });

      console.log('✅ Nova fatura criada:', fatura.id, 'valor:', fatura.valorTotal);
    } else {
      // Atualizar valor total da fatura
      fatura = await prisma.fatura.update({
        where: { id: fatura.id },
        data: {
          valorTotal: {
            increment: Number(conta.valor),
          },
        },
      });

      console.log('✅ Fatura atualizada:', fatura.id, 'novo total:', fatura.valorTotal);
    }

    return fatura;
  } catch (error) {
    console.error('❌ Erro ao atualizar fatura do cartão:', error);
  }
}

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo'); // 'individual' para fluxo de caixa, null para agrupado

    // Construir where base
    const whereBase = { userId: user.id };
    if (empresaId) whereBase.empresaId = empresaId;

    if (modo === 'individual') {
      // Modo individual: retorna parcelas como contas separadas (para fluxo de caixa)
      // Exclui contas pai (que têm totalParcelas > 0) pois são apenas agrupadores
      const contas = await prisma.conta.findMany({
        where: {
          ...whereBase,
          OR: [
            { totalParcelas: null }, // Contas simples (sem parcelamento)
            { parentId: { not: null } }, // Parcelas individuais
          ]
        },
        include: {
          pessoa: true,
          cartao: true,
          socioResponsavel: true,
        },
        orderBy: { vencimento: 'asc' },
      });
      return NextResponse.json(Array.isArray(contas) ? contas : []);
    }

    // Modo padrão: agrupado (para contas a pagar/receber)
    // Buscar todas as contas que NÃO são subcontas (parentId = null) E NÃO são instâncias de recorrência
    // Incluir as parcelas (subcontas) e recorrências dentro de cada conta pai
    const contas = await prisma.conta.findMany({
      where: {
        ...whereBase,
        parentId: null, // Apenas contas principais (não parcelas)
        recorrenciaParentId: null, // Não incluir instâncias de recorrência (elas aparecem dentro do template)
      },
      include: {
        pessoa: true,
        cartao: true,
        socioResponsavel: true,
        parcelas: {
          orderBy: { vencimento: 'asc' },
          include: {
            pessoa: true,
          }
        },
        recorrencias: {
          orderBy: { vencimento: 'asc' },
          include: {
            pessoa: true,
          }
        },
      },
      orderBy: { vencimento: 'asc' },
    });
    // Always ensure we return an array, even if database returns null/undefined
    return NextResponse.json(Array.isArray(contas) ? contas : []);
  } catch (error) {
    console.error('Error fetching contas:', error);
    // CRITICAL FIX: Return empty array on error, not error object
    // This prevents "TypeError: data.filter is not a function" in frontend
    return NextResponse.json([]);
  }
}

// Função para criar data sem offset de timezone
function parseLocalDate(dateStr) {
  // Se a string for no formato YYYY-MM-DD, cria a data como local (meio-dia para evitar problemas de DST)
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Meio-dia para evitar problemas de timezone
  }
  return new Date(dateStr);
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();

    // Verificar se deve criar parcelas
    const totalParcelas = data.totalParcelas ? parseInt(data.totalParcelas) : 1;
    const parcelaAtual = data.numeroParcela ? parseInt(data.numeroParcela.split('/')[0]) : 1;
    const valorParcela = Number(data.valor);

    // Verificar se a conta já deve ser criada como paga
    const criarComoPago = data.pago === true;
    const dataPagamento = data.dataPagamento ? parseLocalDate(data.dataPagamento) : new Date();

    const vencimentoBase = parseLocalDate(data.vencimento);

    console.log('📝 Criando nova conta:', {
      descricao: data.descricao,
      valor: data.valor,
      tipo: data.tipo,
      codigoTipo: data.codigoTipo,
      totalParcelas,
      parcelaAtual,
      criarComoPago,
    });

    // Se for parcelamento (mais de 1 parcela), criar conta pai + subcontas
    if (totalParcelas > 1) {
      // Calcular valor total
      const valorTotal = valorParcela * totalParcelas;

      // Criar conta pai (agrupadora)
      const contaPaiData = {
        descricao: data.descricao,
        valor: valorTotal,
        valorTotal: valorTotal,
        totalParcelas: totalParcelas,
        vencimento: vencimentoBase, // vencimento da primeira parcela
        pago: false, // conta pai nunca é marcada como paga diretamente
        tipo: data.tipo || 'pagar',
        status: 'parcelado', // status especial para conta pai
        userId: user.id,
        empresaId: empresaId || undefined,
      };

      // Add optional fields to parent
      if (data.beneficiario) contaPaiData.beneficiario = data.beneficiario;
      if (data.fonte) contaPaiData.fonte = data.fonte;
      if (data.banco) contaPaiData.banco = data.banco;
      if (data.pessoaId) contaPaiData.pessoaId = Number(data.pessoaId);
      if (data.categoria) contaPaiData.categoria = data.categoria;
      if (data.subcategoria) contaPaiData.subcategoria = data.subcategoria;
      if (data.formaPagamento) contaPaiData.formaPagamento = data.formaPagamento;
      if (data.numeroDocumento) contaPaiData.numeroDocumento = data.numeroDocumento;
      if (data.codigoTipo) contaPaiData.codigoTipo = data.codigoTipo;
      if (data.observacoes) contaPaiData.observacoes = data.observacoes;
      if (data.cartaoId) contaPaiData.cartaoId = Number(data.cartaoId);
      if (data.bancoContaId) contaPaiData.bancoContaId = Number(data.bancoContaId);

      // Buscar socioResponsavelId automaticamente pelo centro de custo
      const socioIdFromCentro = await getSocioIdByCentroCusto(data.codigoTipo, user.id, empresaId);
      if (socioIdFromCentro) contaPaiData.socioResponsavelId = socioIdFromCentro;

      const contaPai = await prisma.conta.create({
        data: contaPaiData,
        include: { pessoa: true },
      });

      console.log(`✅ Conta pai criada com ID: ${contaPai.id} - Valor total: ${valorTotal}`);

      // NOTA: Para contas parceladas no cartão, cada parcela vai para sua própria fatura
      // A fatura será atualizada abaixo para cada parcela individualmente

      // Atualizar previsto/descontoPrevisto do centro de custo com valor total
      if (data.codigoTipo) {
        const whereCentroCusto = { sigla: data.codigoTipo, userId: user.id };
        if (empresaId) whereCentroCusto.empresaId = empresaId;

        const centro = await prisma.centroCusto.findFirst({
          where: whereCentroCusto,
          select: { id: true, isSocio: true, descontoPrevisto: true }
        });

        if (centro) {
          if (centro.isSocio) {
            // Se for sócio, atualizar descontoPrevisto
            await prisma.centroCusto.update({
              where: { id: centro.id },
              data: { descontoPrevisto: centro.descontoPrevisto + valorTotal },
            });
            console.log('📊 Desconto previsto do sócio atualizado:', valorTotal);
          } else {
            // Se não for sócio, atualizar previsto normal
            console.log('📊 Atualizando previsto do centro:', data.codigoTipo);
            await updateCentroAndParent(data.codigoTipo, 'previsto', valorTotal, user.id);
            console.log('✅ Previsto atualizado com valor total');
          }
        }
      }

      // Criar as parcelas como subcontas
      const parcelasCriadas = [];
      for (let i = parcelaAtual; i <= totalParcelas; i++) {
        const vencimentoParcela = new Date(vencimentoBase);
        vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - parcelaAtual));

        const estaPaga = criarComoPago && i === parcelaAtual;

        const parcelaData = {
          descricao: `${data.descricao} - Parcela ${i}/${totalParcelas}`,
          valor: valorParcela,
          vencimento: vencimentoParcela,
          pago: estaPaga,
          tipo: data.tipo || 'pagar',
          numeroParcela: `${i}/${totalParcelas}`,
          parentId: contaPai.id, // Vincula à conta pai
          userId: user.id,
          empresaId: empresaId || undefined,
        };

        if (estaPaga) {
          parcelaData.dataPagamento = dataPagamento;
          parcelaData.noFluxoCaixa = true;
          parcelaData.status = 'pago';
        }

        // Add optional fields to parcela
        if (data.beneficiario) parcelaData.beneficiario = data.beneficiario;
        if (data.codigoTipo) parcelaData.codigoTipo = data.codigoTipo;
        if (data.cartaoId) parcelaData.cartaoId = Number(data.cartaoId);
        // Vincular sócio automaticamente pelo centro de custo
        if (socioIdFromCentro) parcelaData.socioResponsavelId = socioIdFromCentro;

        const novaParcela = await prisma.conta.create({
          data: parcelaData,
          include: { pessoa: true },
        });

        console.log(`✅ Parcela ${i}/${totalParcelas} criada com ID: ${novaParcela.id}`);
        parcelasCriadas.push(novaParcela);

        // Se a parcela foi criada com cartão de crédito, atualizar fatura do mês correspondente
        if (data.cartaoId) {
          await atualizarFaturaCartao(novaParcela, data.cartaoId, user.id, empresaId);
        }

        // Se a parcela foi criada já paga, criar registro no fluxo de caixa
        if (estaPaga) {
          console.log('💰 Parcela criada como paga, criando registro no fluxo de caixa...');

          const ultimoFluxo = await prisma.fluxoCaixa.findFirst({
            where: { userId: user.id },
            orderBy: { dia: 'desc' },
          });

          const saldoAnterior = ultimoFluxo?.fluxo || 0;
          const tipoFluxo = novaParcela.tipo === 'receber' ? 'entrada' : 'saida';
          const novoFluxo = tipoFluxo === 'entrada'
            ? saldoAnterior + Number(novaParcela.valor)
            : saldoAnterior - Number(novaParcela.valor);

          const fluxoData = {
            dia: dataPagamento,
            codigoTipo: novaParcela.codigoTipo || `${tipoFluxo === 'entrada' ? 'REC' : 'PAG'}-${novaParcela.id}`,
            fornecedorCliente: novaParcela.beneficiario || novaParcela.descricao,
            valor: Number(novaParcela.valor),
            tipo: tipoFluxo,
            fluxo: novoFluxo,
            contaId: novaParcela.id,
            centroCustoSigla: novaParcela.codigoTipo,
            userId: user.id,
            empresaId: empresaId || undefined,
          };

          if (data.bancoId) {
            fluxoData.bancoId = Number(data.bancoId);
          }

          const fluxoCriado = await prisma.fluxoCaixa.create({
            data: fluxoData,
          });

          console.log('✅ Fluxo criado:', fluxoCriado.id);

          // Atualizar realizado do centro de custo (apenas o valor da parcela paga)
          if (novaParcela.codigoTipo) {
            await updateCentroAndParent(novaParcela.codigoTipo, 'realizado', Number(novaParcela.valor), user.id);
          }
        }
      }

      // Retornar conta pai com as parcelas
      const contaComParcelas = await prisma.conta.findUnique({
        where: { id: contaPai.id },
        include: {
          pessoa: true,
          parcelas: {
            orderBy: { vencimento: 'asc' }
          }
        }
      });

      console.log(`✅ Total de ${parcelasCriadas.length} parcelas criadas sob conta pai ${contaPai.id}`);
      return NextResponse.json({
        success: true,
        message: `Conta parcelada criada com ${parcelasCriadas.length} parcelas`,
        conta: contaComParcelas,
      });
    }

    // Conta simples (sem parcelamento)
    const contaData = {
      descricao: data.descricao,
      valor: valorParcela,
      vencimento: vencimentoBase,
      pago: criarComoPago,
      tipo: data.tipo || 'pagar',
      userId: user.id,
      empresaId: empresaId || undefined,
    };

    if (criarComoPago) {
      contaData.dataPagamento = dataPagamento;
      contaData.noFluxoCaixa = true;
      contaData.status = 'pago';
    }

    // Add optional fields
    if (data.beneficiario) contaData.beneficiario = data.beneficiario;
    if (data.fonte) contaData.fonte = data.fonte;
    if (data.banco) contaData.banco = data.banco;
    if (data.pessoaId) contaData.pessoaId = Number(data.pessoaId);
    if (data.categoria) contaData.categoria = data.categoria;
    if (data.subcategoria) contaData.subcategoria = data.subcategoria;
    if (data.formaPagamento) contaData.formaPagamento = data.formaPagamento;
    if (data.numeroDocumento) contaData.numeroDocumento = data.numeroDocumento;
    if (data.codigoTipo) contaData.codigoTipo = data.codigoTipo;
    if (data.observacoes) contaData.observacoes = data.observacoes;
    if (data.cartaoId) contaData.cartaoId = Number(data.cartaoId);
    if (data.bancoContaId) contaData.bancoContaId = Number(data.bancoContaId);

    // Buscar socioResponsavelId automaticamente pelo centro de custo
    const socioIdFromCentroSimples = await getSocioIdByCentroCusto(data.codigoTipo, user.id, empresaId);
    if (socioIdFromCentroSimples) contaData.socioResponsavelId = socioIdFromCentroSimples;

    const novaConta = await prisma.conta.create({
      data: contaData,
      include: { pessoa: true },
    });

    console.log(`✅ Conta simples criada com ID: ${novaConta.id}`);

    // Se a conta foi criada com cartão de crédito, criar/atualizar fatura
    if (data.cartaoId) {
      await atualizarFaturaCartao(novaConta, data.cartaoId, user.id, empresaId);
    }

    // Atualizar previsto/descontoPrevisto do centro de custo
    const whereCentroSimples = { sigla: data.codigoTipo, userId: user.id };
    if (empresaId) whereCentroSimples.empresaId = empresaId;

    const centroSimples = data.codigoTipo ? await prisma.centroCusto.findFirst({
      where: whereCentroSimples,
      select: { id: true, isSocio: true, descontoPrevisto: true }
    }) : null;

    if (data.codigoTipo && centroSimples) {
      if (centroSimples.isSocio) {
        // Se for sócio, atualizar descontoPrevisto
        await prisma.centroCusto.update({
          where: { id: centroSimples.id },
          data: { descontoPrevisto: centroSimples.descontoPrevisto + valorParcela },
        });
        console.log('📊 Desconto previsto do sócio atualizado:', valorParcela);
      } else {
        // Se não for sócio, atualizar previsto normal
        await updateCentroAndParent(data.codigoTipo, 'previsto', valorParcela, user.id);
      }
    }

    // Se a conta foi criada já paga, criar registro no fluxo de caixa
    if (criarComoPago) {
      const whereFluxo = { userId: user.id };
      if (empresaId) whereFluxo.empresaId = empresaId;

      const ultimoFluxo = await prisma.fluxoCaixa.findFirst({
        where: whereFluxo,
        orderBy: { dia: 'desc' },
      });

      const saldoAnterior = ultimoFluxo?.fluxo || 0;
      const tipoFluxo = novaConta.tipo === 'receber' ? 'entrada' : 'saida';
      const novoFluxo = tipoFluxo === 'entrada'
        ? saldoAnterior + Number(novaConta.valor)
        : saldoAnterior - Number(novaConta.valor);

      const fluxoData = {
        dia: dataPagamento,
        codigoTipo: novaConta.codigoTipo || `${tipoFluxo === 'entrada' ? 'REC' : 'PAG'}-${novaConta.id}`,
        fornecedorCliente: novaConta.beneficiario || novaConta.pessoa?.nome || novaConta.descricao,
        valor: Number(novaConta.valor),
        tipo: tipoFluxo,
        fluxo: novoFluxo,
        contaId: novaConta.id,
        centroCustoSigla: novaConta.codigoTipo,
        userId: user.id,
        empresaId: empresaId || undefined,
      };

      if (data.bancoId) {
        fluxoData.bancoId = Number(data.bancoId);
      }

      await prisma.fluxoCaixa.create({
        data: fluxoData,
      });

      // Atualizar realizado/descontoReal do centro de custo
      if (novaConta.codigoTipo && centroSimples) {
        if (centroSimples.isSocio && tipoFluxo === 'saida') {
          // Se for sócio e saída, atualizar descontoReal
          await prisma.centroCusto.update({
            where: { id: centroSimples.id },
            data: { descontoReal: { increment: Number(novaConta.valor) } },
          });
          console.log('💰 Desconto real do sócio atualizado:', novaConta.valor);
        } else if (!centroSimples.isSocio) {
          // Se não for sócio, atualizar realizado
          await updateCentroAndParent(novaConta.codigoTipo, 'realizado', Number(novaConta.valor), user.id);
        }
      }
    }

    return NextResponse.json(novaConta);
  } catch (error) {
    console.error('Error creating conta:', error);
    return NextResponse.json(
      { error: 'Failed to create conta' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();

    // Construir where com empresaId se disponível
    const whereConta = { id: data.id, userId: user.id };
    if (empresaId) whereConta.empresaId = empresaId;

    // Buscar a conta atual antes de atualizar (verificando se pertence ao usuário e empresa)
    const contaAtual = await prisma.conta.findFirst({
      where: whereConta,
      include: { pessoa: true },
    });

    if (!contaAtual) {
      return NextResponse.json(
        { error: 'Conta not found' },
        { status: 404 }
      );
    }

    // Verificar se está marcando como pago agora
    const marcandoComoPago = data.pago === true && contaAtual.pago === false;

    // Build update data conditionally
    const updateData = {};

    // Always update pago if provided
    if (data.pago !== undefined) {
      updateData.pago = data.pago;
      updateData.dataPagamento = data.pago ? new Date() : null;
      updateData.status = data.pago ? 'pago' : contaAtual.status;
      if (marcandoComoPago) updateData.noFluxoCaixa = true;
    }

    // Update other fields only if provided
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.valor !== undefined) updateData.valor = Number(data.valor);
    if (data.vencimento !== undefined) updateData.vencimento = parseLocalDate(data.vencimento);
    if (data.beneficiario !== undefined) updateData.beneficiario = data.beneficiario;
    if (data.fonte !== undefined) updateData.fonte = data.fonte;
    if (data.banco !== undefined) updateData.banco = data.banco;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.subcategoria !== undefined) updateData.subcategoria = data.subcategoria;
    if (data.formaPagamento !== undefined) updateData.formaPagamento = data.formaPagamento;
    if (data.numeroDocumento !== undefined) updateData.numeroDocumento = data.numeroDocumento;
    if (data.numeroParcela !== undefined) updateData.numeroParcela = data.numeroParcela;
    if (data.codigoTipo !== undefined) updateData.codigoTipo = data.codigoTipo;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;

    // Atualizar a conta
    const contaAtualizada = await prisma.conta.update({
      where: { id: data.id },
      data: updateData,
      include: { pessoa: true },
    });

    // Se é uma parcela e o valor foi alterado, atualizar o valor do pai
    if (contaAtual.parentId && data.valor !== undefined && Number(data.valor) !== contaAtual.valor) {
      console.log('📊 Parcela teve valor alterado, recalculando valor do pai...');

      // Buscar todas as parcelas do pai (incluindo a que acabou de ser atualizada)
      const todasParcelas = await prisma.conta.findMany({
        where: { parentId: contaAtual.parentId },
      });

      // Calcular novo valor total
      const novoValorTotal = todasParcelas.reduce((sum, p) => sum + Number(p.valor), 0);

      // Atualizar o pai
      await prisma.conta.update({
        where: { id: contaAtual.parentId },
        data: {
          valor: novoValorTotal,
          valorTotal: novoValorTotal,
        },
      });

      console.log(`✅ Valor do pai (ID: ${contaAtual.parentId}) atualizado para: ${novoValorTotal}`);
    }

    // Se está marcando como pago, registrar no fluxo de caixa
    if (marcandoComoPago) {
      console.log('🔥 Marcando conta como paga:', {
        id: contaAtualizada.id,
        tipo: contaAtualizada.tipo,
        valor: contaAtualizada.valor,
        codigoTipo: contaAtualizada.codigoTipo,
      });

      // Construir where para fluxo
      const whereFluxo = { userId: user.id };
      if (empresaId) whereFluxo.empresaId = empresaId;

      // Buscar o último fluxo para calcular o novo saldo
      const ultimoFluxo = await prisma.fluxoCaixa.findFirst({
        where: whereFluxo,
        orderBy: { dia: 'desc' },
      });

      const saldoAnterior = ultimoFluxo?.fluxo || 0;
      const tipo = contaAtualizada.tipo === 'receber' ? 'entrada' : 'saida';
      const novoFluxo = tipo === 'entrada'
        ? saldoAnterior + Number(contaAtualizada.valor)
        : saldoAnterior - Number(contaAtualizada.valor);

      console.log('💰 Criando fluxo de caixa:', {
        tipo,
        valor: contaAtualizada.valor,
        saldoAnterior,
        novoFluxo,
      });

      // Criar registro no fluxo de caixa
      const fluxoData = {
        dia: new Date(),
        codigoTipo: contaAtualizada.codigoTipo || `${tipo === 'entrada' ? 'REC' : 'PAG'}-${contaAtualizada.id}`,
        fornecedorCliente: contaAtualizada.beneficiario || contaAtualizada.pessoa?.nome || contaAtualizada.descricao,
        valor: Number(contaAtualizada.valor),
        tipo,
        fluxo: novoFluxo,
        contaId: contaAtualizada.id,
        centroCustoSigla: contaAtualizada.codigoTipo,
        userId: user.id,
        empresaId: empresaId || undefined,
      };

      // Adicionar bancoId se fornecido
      if (data.bancoId) {
        fluxoData.bancoId = Number(data.bancoId);
      }

      const fluxoCriado = await prisma.fluxoCaixa.create({
        data: fluxoData,
      });

      console.log('✅ Fluxo criado:', fluxoCriado.id);

      // Atualizar o campo "realizado" ou "descontoReal" do centro de custo
      if (contaAtualizada.codigoTipo) {
        const whereCentroPagamento = { sigla: contaAtualizada.codigoTipo, userId: user.id };
        if (empresaId) whereCentroPagamento.empresaId = empresaId;

        const centroPagamento = await prisma.centroCusto.findFirst({
          where: whereCentroPagamento,
          select: { id: true, isSocio: true }
        });

        if (centroPagamento) {
          if (centroPagamento.isSocio && tipoFluxo === 'saida') {
            // Se for sócio e saída, atualizar descontoReal
            await prisma.centroCusto.update({
              where: { id: centroPagamento.id },
              data: { descontoReal: { increment: Number(contaAtualizada.valor) } },
            });
            console.log('💰 Desconto real do sócio atualizado:', contaAtualizada.valor);
          } else if (!centroPagamento.isSocio) {
            // Se não for sócio, atualizar realizado
            console.log('📊 Atualizando centro de custo:', contaAtualizada.codigoTipo);
            await updateCentroAndParent(contaAtualizada.codigoTipo, 'realizado', Number(contaAtualizada.valor), user.id);
            console.log('✅ Centro de custo atualizado');
          }
        }
      } else {
        console.log('⚠️ Conta sem codigoTipo, não atualiza centro de custo');
      }

    }

    return NextResponse.json(contaAtualizada);
  } catch (error) {
    console.error('Error updating conta:', error);
    return NextResponse.json(
      { error: 'Failed to update conta' },
      { status: 500 }
    );
  }
}

// Função auxiliar para deletar uma conta individual (usada no delete principal e para parcelas)
async function deletarContaIndividual(conta, userId, empresaId = null) {
  console.log('📊 Deletando conta:', {
    id: conta.id,
    tipo: conta.tipo,
    valor: conta.valor,
    pago: conta.pago,
    codigoTipo: conta.codigoTipo,
  });

  // Se tem codigoTipo, precisa atualizar os centros de custo
  if (conta.codigoTipo) {
    const whereCentro = { sigla: conta.codigoTipo, userId };
    if (empresaId) whereCentro.empresaId = empresaId;

    const centro = await prisma.centroCusto.findFirst({
      where: whereCentro,
      select: { id: true, isSocio: true }
    });

    if (centro) {
      if (centro.isSocio) {
        // Se for sócio, decrementar descontoPrevisto
        await prisma.centroCusto.update({
          where: { id: centro.id },
          data: { descontoPrevisto: { decrement: Number(conta.valor) } },
        });
        console.log('📊 Desconto previsto do sócio decrementado:', conta.valor);

        // Se estava paga, decrementar descontoReal também
        if (conta.pago) {
          await prisma.centroCusto.update({
            where: { id: centro.id },
            data: { descontoReal: { decrement: Number(conta.valor) } },
          });
          console.log('💰 Desconto real do sócio decrementado:', conta.valor);
        }
      } else {
        // Se não for sócio, decrementar previsto normal
        console.log('📊 Decrementando previsto do centro:', conta.codigoTipo);
        await updateCentroAndParent(conta.codigoTipo, 'previsto', -Number(conta.valor), userId);
        console.log('✅ Previsto decrementado');

        // Se estava paga, decrementar do realizado
        if (conta.pago) {
          console.log('📊 Conta estava paga, decrementando realizado também');
          await updateCentroAndParent(conta.codigoTipo, 'realizado', -Number(conta.valor), userId);
          console.log('✅ Realizado decrementado');
        }
      }
    }
  } else {
    console.log('⚠️ Conta sem codigoTipo, não atualiza centros');
  }

  // Deletar o registro do fluxo de caixa se existir
  if (conta.pago && conta.noFluxoCaixa) {
    console.log('💰 Deletando registro do fluxo de caixa...');

    await prisma.fluxoCaixa.deleteMany({
      where: { contaId: conta.id, userId },
    });

    console.log('✅ Fluxo de caixa deletado para conta', conta.id);
  }

  // Deletar a conta
  await prisma.conta.delete({ where: { id: conta.id } });
  console.log('✅ Conta', conta.id, 'deletada');
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await request.json();

    console.log('🗑️ Deletando conta ID:', id);

    // Construir where com empresaId se disponível
    const whereConta = { id, userId: user.id };
    if (empresaId) whereConta.empresaId = empresaId;

    // Buscar a conta antes de deletar, incluindo as parcelas se existirem
    const conta = await prisma.conta.findFirst({
      where: whereConta,
      include: {
        pessoa: true,
        parcelas: true, // Incluir parcelas filhas
      },
    });

    if (!conta) {
      console.log('❌ Conta não encontrada');
      return NextResponse.json(
        { error: 'Conta not found' },
        { status: 404 }
      );
    }

    // Se é uma conta pai com parcelas, deletar todas as parcelas primeiro
    if (conta.parcelas && conta.parcelas.length > 0) {
      console.log(`📦 Conta pai com ${conta.parcelas.length} parcelas, deletando todas...`);

      for (const parcela of conta.parcelas) {
        await deletarContaIndividual(parcela, user.id, empresaId);
      }

      console.log('✅ Todas as parcelas deletadas');
    }

    // Agora deletar a conta principal (ou a conta simples sem parcelas)
    await deletarContaIndividual(conta, user.id, empresaId);

    // Recalcular saldos do fluxo de caixa se alguma conta estava paga
    const precisaRecalcular = conta.pago || (conta.parcelas && conta.parcelas.some(p => p.pago));

    if (precisaRecalcular) {
      console.log('🔄 Recalculando saldos do fluxo de caixa...');
      const whereFluxo = { userId: user.id };
      if (empresaId) whereFluxo.empresaId = empresaId;

      const todosFluxos = await prisma.fluxoCaixa.findMany({
        where: whereFluxo,
        orderBy: { dia: 'asc' },
      });

      let saldoAcumulado = 0;
      for (const fluxo of todosFluxos) {
        if (fluxo.tipo === 'entrada') {
          saldoAcumulado += Number(fluxo.valor);
        } else {
          saldoAcumulado -= Number(fluxo.valor);
        }

        await prisma.fluxoCaixa.update({
          where: { id: fluxo.id },
          data: { fluxo: saldoAcumulado },
        });
      }

      console.log('✅ Saldos recalculados');
    }

    console.log('✅ Exclusão concluída com sucesso');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting conta:', error);
    return NextResponse.json(
      { error: 'Failed to delete conta' },
      { status: 500 }
    );
  }
}
