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

// POST - Criar múltiplas contas individualmente (sem agrupamento)
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

    console.log(`📝 Criando ${contas.length} contas individuais`);

    const contasCriadas = [];
    const erros = [];

    for (let i = 0; i < contas.length; i++) {
      const conta = contas[i];

      try {
        const vencimento = parseLocalDate(conta.vencimento);
        const valor = Number(conta.valor);

        // Buscar ID do sócio pelo centro de custo
        const socioIdFromCentro = await getSocioIdByCentroCusto(conta.codigoTipo || null, user.id, empresaId);

        const contaData: any = {
          descricao: conta.descricao,
          valor: valor,
          vencimento: vencimento,
          pago: conta.pago || false,
          tipo: conta.tipo || "pagar",
          status: conta.pago ? "pago" : "pendente",
          userId: user.id,
          empresaId: empresaId || undefined,
        };

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

        console.log(`✅ Conta ${i + 1}/${contas.length} criada: ${novaConta.descricao}`);
        contasCriadas.push(novaConta);

        // Buscar centro de custo para verificar se é sócio
        console.log(`🔍 Buscando centro: codigoTipo=${conta.codigoTipo}, userId=${user.id}, empresaId=${empresaId}`);

        const whereCentro: any = { sigla: conta.codigoTipo, userId: user.id };
        if (empresaId) whereCentro.empresaId = empresaId;

        const centro = conta.codigoTipo
          ? await prisma.centroCusto.findFirst({
              where: whereCentro,
              select: { id: true, isSocio: true, descontoPrevisto: true, nome: true },
            })
          : null;

        console.log(`🔍 Centro encontrado:`, centro ? `id=${centro.id}, nome=${centro.nome}, isSocio=${centro.isSocio}, descontoPrevisto=${centro.descontoPrevisto}` : 'NÃO ENCONTRADO');

        // Atualizar previsto/descontoPrevisto do centro de custo
        if (conta.codigoTipo && centro) {
          if (centro.isSocio) {
            // Se for sócio, atualizar descontoPrevisto
            const novoDesconto = (centro.descontoPrevisto || 0) + valor;
            await prisma.centroCusto.update({
              where: { id: centro.id },
              data: { descontoPrevisto: novoDesconto },
            });
            console.log(`📊 Desconto previsto do sócio atualizado: ${centro.descontoPrevisto || 0} -> ${novoDesconto} (+${valor})`);
          } else {
            // Se não for sócio, atualizar previsto normal
            await updateCentroAndParent(conta.codigoTipo, "previsto", valor, user.id);
          }
        } else if (conta.codigoTipo && !centro) {
          console.log(`⚠️ Centro de custo ${conta.codigoTipo} NÃO ENCONTRADO!`);
        }

        // Se a conta foi criada já paga, criar registro no fluxo de caixa
        if (conta.pago) {
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

          // Atualizar realizado/descontoReal do centro de custo
          if (novaConta.codigoTipo && centro) {
            if (centro.isSocio && tipoFluxo === "saida") {
              // Se for sócio e saída, atualizar descontoReal
              await prisma.centroCusto.update({
                where: { id: centro.id },
                data: { descontoReal: { increment: Number(novaConta.valor) } },
              });
              console.log(`💰 Desconto real do sócio atualizado: +${novaConta.valor}`);
            } else if (!centro.isSocio) {
              // Se não for sócio, atualizar realizado
              await updateCentroAndParent(
                novaConta.codigoTipo,
                "realizado",
                Number(novaConta.valor),
                user.id
              );
            }
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
      message: `${contasCriadas.length} conta(s) criada(s) com sucesso`,
      contas: contasCriadas,
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
