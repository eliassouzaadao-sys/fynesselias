import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// Helper para parsear data local
function parseLocalDate(dateStr: string): Date {
  if (dateStr && dateStr.includes("-") && dateStr.length === 10) {
    const [year, month, day] = dateStr.split("-").map(Number);
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
async function getSocioIdByCentroCusto(codigoTipo: string | null, userId: number, empresaId?: number | null): Promise<number | null> {
  if (!codigoTipo) return null;

  const where: any = {
    sigla: codigoTipo,
    userId: userId,
    isSocio: true,
  };
  if (empresaId) where.empresaId = empresaId;

  const centro = await prisma.centroCusto.findFirst({
    where,
    select: { id: true },
  });

  return centro?.id || null;
}

interface ContaInput {
  descricao: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  tipo: "pagar" | "receber";
  codigoTipo?: string;
  beneficiario?: string;
  numeroDocumento?: string;
  cartaoId?: number;
  bancoContaId?: number;
  pessoaId?: number;
}

// Helper para detectar se é parcela pelo padrão "Parcela X/Y" na descrição
function parseParcelaInfo(descricao: string): { isParcela: boolean; numeroParcela?: string; descricaoBase?: string; total?: number } {
  // Padrão: "Descrição - Parcela X/Y"
  const match = descricao.match(/^(.+?)\s*-\s*Parcela\s+(\d+)\/(\d+)$/i);
  if (match) {
    return {
      isParcela: true,
      descricaoBase: match[1].trim(),
      numeroParcela: `${match[2]}/${match[3]}`,
      total: parseInt(match[3]),
    };
  }
  return { isParcela: false };
}

// POST - Criar múltiplas contas (com agrupamento automático para parcelamentos)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const data = await request.json();

    const { contas } = data as { contas: ContaInput[] };

    if (!contas || !Array.isArray(contas) || contas.length === 0) {
      return NextResponse.json(
        { error: "Lista de contas é obrigatória" },
        { status: 400 }
      );
    }

    // Limite para evitar DoS
    if (contas.length > 100) {
      return NextResponse.json(
        { error: "Limite máximo de 100 contas por requisição" },
        { status: 400 }
      );
    }

    console.log(`📝 Processando ${contas.length} contas`);

    // Verificar se é parcelamento
    const primeiraContaInfo = parseParcelaInfo(contas[0].descricao);
    const isParcelamento = primeiraContaInfo.isParcela && contas.length > 1;

    console.log(`📝 É parcelamento: ${isParcelamento}`, primeiraContaInfo);

    const contasCriadas = [];
    const erros = [];

    // Se for parcelamento, criar conta macro primeiro
    let contaMacro: any = null;
    let grupoParcelamentoId: string | null = null;

    if (isParcelamento) {
      grupoParcelamentoId = crypto.randomUUID();
      const valorTotal = contas.reduce((sum, c) => sum + Number(c.valor), 0);
      const descricaoBase = primeiraContaInfo.descricaoBase || contas[0].descricao;
      const primeiroVencimento = parseLocalDate(contas[0].vencimento);

      // Buscar ID do sócio pelo centro de custo
      const socioIdFromCentro = await getSocioIdByCentroCusto(
        contas[0].codigoTipo || null,
        user.id,
        empresaId
      );

      const macroData: any = {
        descricao: descricaoBase,
        valor: valorTotal,
        valorTotal: valorTotal,
        vencimento: primeiroVencimento,
        pago: false, // Macro nunca é paga diretamente
        tipo: contas[0].tipo || "pagar",
        isContaMacro: true,
        totalParcelas: contas.length,
        grupoParcelamentoId: grupoParcelamentoId,
        userId: user.id,
        empresaId: empresaId || undefined,
      };

      // Campos opcionais
      if (contas[0].beneficiario) macroData.beneficiario = contas[0].beneficiario;
      if (contas[0].codigoTipo) macroData.codigoTipo = contas[0].codigoTipo;
      if (contas[0].numeroDocumento) macroData.numeroDocumento = contas[0].numeroDocumento;
      if (contas[0].cartaoId) macroData.cartaoId = Number(contas[0].cartaoId);
      if (contas[0].bancoContaId) macroData.bancoContaId = Number(contas[0].bancoContaId);
      if (contas[0].pessoaId) macroData.pessoaId = Number(contas[0].pessoaId);
      if (socioIdFromCentro) macroData.socioResponsavelId = socioIdFromCentro;

      contaMacro = await prisma.conta.create({
        data: macroData,
        include: { pessoa: true },
      });

      console.log(`✅ Conta MACRO criada: ID ${contaMacro.id}, valor total: ${valorTotal}`);

      // Atualizar previsto do centro de custo com valor total
      if (contas[0].codigoTipo) {
        const whereCentro: any = { sigla: contas[0].codigoTipo, userId: user.id };
        if (empresaId) whereCentro.empresaId = empresaId;

        const centro = await prisma.centroCusto.findFirst({
          where: whereCentro,
          select: { id: true, isSocio: true, descontoPrevisto: true },
        });

        if (centro) {
          if (centro.isSocio) {
            await prisma.centroCusto.update({
              where: { id: centro.id },
              data: { descontoPrevisto: (centro.descontoPrevisto || 0) + valorTotal },
            });
            console.log(`📊 Desconto previsto do sócio atualizado: +${valorTotal}`);
          } else {
            await updateCentroAndParent(contas[0].codigoTipo, "previsto", valorTotal, user.id);
            console.log(`📊 Previsto do centro atualizado: +${valorTotal}`);
          }
        }
      }
    }

    // Criar as contas/parcelas
    for (let i = 0; i < contas.length; i++) {
      const conta = contas[i];

      try {
        const vencimento = parseLocalDate(conta.vencimento);
        const valor = Number(conta.valor);

        // Buscar ID do sócio pelo centro de custo
        const socioIdFromCentro = await getSocioIdByCentroCusto(conta.codigoTipo || null, user.id, empresaId);

        // Parse info da parcela
        const parcelaInfo = parseParcelaInfo(conta.descricao);

        const contaData: any = {
          descricao: isParcelamento ? primeiraContaInfo.descricaoBase : conta.descricao, // Descrição sem "Parcela X/Y"
          valor: valor,
          vencimento: vencimento,
          pago: conta.pago || false,
          tipo: conta.tipo || "pagar",
          status: conta.pago ? "pago" : "pendente",
          userId: user.id,
          empresaId: empresaId || undefined,
        };

        // Se for parcelamento, adicionar vinculação à macro
        if (isParcelamento && contaMacro) {
          contaData.parentId = contaMacro.id;
          contaData.grupoParcelamentoId = grupoParcelamentoId;
          contaData.numeroParcela = parcelaInfo.numeroParcela || `${i + 1}/${contas.length}`;
          contaData.totalParcelas = contas.length;
        }

        if (conta.pago) {
          contaData.dataPagamento = new Date();
          contaData.noFluxoCaixa = true;
        }

        // Campos opcionais
        if (conta.beneficiario) contaData.beneficiario = conta.beneficiario;
        if (conta.codigoTipo) contaData.codigoTipo = conta.codigoTipo;
        if (conta.numeroDocumento) contaData.numeroDocumento = conta.numeroDocumento;
        if (conta.cartaoId) contaData.cartaoId = Number(conta.cartaoId);
        if (conta.bancoContaId) contaData.bancoContaId = Number(conta.bancoContaId);
        if (conta.pessoaId) contaData.pessoaId = Number(conta.pessoaId);
        if (socioIdFromCentro) contaData.socioResponsavelId = socioIdFromCentro;

        const novaConta = await prisma.conta.create({
          data: contaData,
          include: { pessoa: true },
        });

        console.log(`✅ ${isParcelamento ? 'Parcela' : 'Conta'} ${i + 1}/${contas.length} criada: ID ${novaConta.id}${isParcelamento ? `, parentId: ${contaMacro?.id}` : ''}`);
        contasCriadas.push(novaConta);

        // Buscar centro de custo para verificar se é sócio
        const whereCentro: any = { sigla: conta.codigoTipo, userId: user.id };
        if (empresaId) whereCentro.empresaId = empresaId;

        const centro = conta.codigoTipo
          ? await prisma.centroCusto.findFirst({
              where: whereCentro,
              select: { id: true, isSocio: true, descontoPrevisto: true, nome: true },
            })
          : null;

        // Se NÃO for parcelamento, atualizar previsto/descontoPrevisto do centro de custo
        if (!isParcelamento && conta.codigoTipo && centro) {
          if (centro.isSocio) {
            const novoDesconto = (centro.descontoPrevisto || 0) + valor;
            await prisma.centroCusto.update({
              where: { id: centro.id },
              data: { descontoPrevisto: novoDesconto },
            });
            console.log(`📊 Desconto previsto do sócio atualizado: +${valor}`);
          } else {
            await updateCentroAndParent(conta.codigoTipo, "previsto", valor, user.id);
          }
        }

        // Se a conta foi criada já paga, criar registro no fluxo de caixa
        // NUNCA criar fluxo para conta macro - apenas parcelas individuais
        if (conta.pago && !novaConta.isContaMacro) {
          const whereFluxo: any = { userId: user.id };
          if (empresaId) whereFluxo.empresaId = empresaId;

          const ultimoFluxo = await prisma.fluxoCaixa.findFirst({
            where: whereFluxo,
            orderBy: { dia: "desc" },
          });

          const saldoAnterior = ultimoFluxo?.fluxo || 0;
          const tipoFluxo = novaConta.tipo === "receber" ? "entrada" : "saida";
          const novoFluxo =
            tipoFluxo === "entrada"
              ? saldoAnterior + Number(novaConta.valor)
              : saldoAnterior - Number(novaConta.valor);

          const fluxoData: any = {
            dia: new Date(),
            codigoTipo:
              novaConta.codigoTipo ||
              `${tipoFluxo === "entrada" ? "REC" : "PAG"}-${novaConta.id}`,
            fornecedorCliente:
              novaConta.beneficiario || novaConta.descricao,
            valor: Number(novaConta.valor),
            tipo: tipoFluxo,
            fluxo: novoFluxo,
            contaId: novaConta.id,
            centroCustoSigla: novaConta.codigoTipo,
            userId: user.id,
            empresaId: empresaId || undefined,
          };

          await prisma.fluxoCaixa.create({
            data: fluxoData,
          });

          // Atualizar realizado do centro de custo
          if (novaConta.codigoTipo && centro && !centro.isSocio) {
            await updateCentroAndParent(
              novaConta.codigoTipo,
              "realizado",
              Number(novaConta.valor),
              user.id
            );
          }

          console.log(`💰 Fluxo de caixa criado para conta ${novaConta.id}`);
        }
      } catch (err: any) {
        console.error(`❌ Erro ao criar conta ${i + 1}:`, err);
        erros.push({
          index: i,
          descricao: conta.descricao,
          error: err.message,
        });
      }
    }

    console.log(`✅ Total: ${contasCriadas.length} contas criadas, ${erros.length} erros`);

    return NextResponse.json({
      success: true,
      message: isParcelamento
        ? `Conta macro + ${contasCriadas.length} parcelas criadas`
        : `${contasCriadas.length} conta(s) criada(s) com sucesso`,
      contaMacro: contaMacro,
      contas: contasCriadas,
      grupoParcelamentoId: grupoParcelamentoId,
      erros: erros.length > 0 ? erros : undefined,
      totalCriadas: contasCriadas.length,
      totalErros: erros.length,
    });
  } catch (error) {
    console.error("Erro ao criar contas em lote:", error);
    return NextResponse.json(
      { error: "Falha ao criar contas" },
      { status: 500 }
    );
  }
}
