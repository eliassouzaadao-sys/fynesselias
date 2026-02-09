import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Detalhes da fatura com lançamentos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await params;
    const faturaId = parseInt(id);

    if (isNaN(faturaId)) {
      return NextResponse.json(
        { error: "ID da fatura inválido" },
        { status: 400 }
      );
    }

    const faturaWhere: any = { id: faturaId, userId: user.id };
    if (empresaId) faturaWhere.empresaId = empresaId;

    const fatura = await prisma.fatura.findFirst({
      where: faturaWhere,
      include: {
        cartao: {
          select: {
            id: true,
            nome: true,
            bandeira: true,
            ultimos4Digitos: true,
            diaVencimento: true,
            diaFechamento: true
          }
        }
      }
    });

    if (!fatura) {
      return NextResponse.json(
        { error: "Fatura não encontrada" },
        { status: 404 }
      );
    }

    // Buscar lançamentos (contas) vinculados ao cartão que pertencem a este mês de uso
    // A fatura é referenciada pelo mês de USO, então buscamos contas com vencimento nesse mês
    const inicioMes = new Date(fatura.anoReferencia, fatura.mesReferencia - 1, 1, 0, 0, 0);
    const fimMes = new Date(fatura.anoReferencia, fatura.mesReferencia, 0, 23, 59, 59);

    // Excluir contas pai (totalParcelas > 0) pois são apenas agrupadores
    const lancamentosWhere: any = {
      userId: user.id,
      cartaoId: fatura.cartaoId,
      vencimento: {
        gte: inicioMes,
        lte: fimMes
      },
      OR: [
        { totalParcelas: null }, // Contas simples (sem parcelamento)
        { parentId: { not: null } }, // Parcelas individuais
      ]
    };
    if (empresaId) lancamentosWhere.empresaId = empresaId;

    console.log("📅 Buscando lançamentos da fatura:", {
      faturaId: fatura.id,
      mes: fatura.mesReferencia,
      ano: fatura.anoReferencia,
      inicioMes: inicioMes.toISOString(),
      fimMes: fimMes.toISOString(),
      cartaoId: fatura.cartaoId
    });

    const lancamentos = await prisma.conta.findMany({
      where: lancamentosWhere,
      orderBy: { vencimento: "asc" },
      select: {
        id: true,
        descricao: true,
        valor: true,
        vencimento: true,
        beneficiario: true,
        numeroParcela: true,
        codigoTipo: true,
        pago: true,
        criadoEm: true,
        pessoa: {
          select: {
            nome: true
          }
        }
      }
    });

    console.log("📦 Lançamentos encontrados:", lancamentos.length, lancamentos.map((l: { id: number; descricao: string; valor: number; vencimento: Date }) => ({
      id: l.id,
      descricao: l.descricao,
      valor: l.valor,
      vencimento: l.vencimento
    })));

    // Calcular totais
    const totalLancamentos = lancamentos.reduce((sum: number, l: { valor: number }) => sum + l.valor, 0);
    const quantidadeLancamentos = lancamentos.length;

    return NextResponse.json({
      ...fatura,
      lancamentos,
      totalLancamentos,
      quantidadeLancamentos
    });
  } catch (error) {
    console.error("❌ Erro ao buscar fatura:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fatura" },
      { status: 500 }
    );
  }
}

// PUT - Marcar fatura como paga
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await params;
    const faturaId = parseInt(id);

    if (isNaN(faturaId)) {
      return NextResponse.json(
        { error: "ID da fatura inválido" },
        { status: 400 }
      );
    }

    const data = await request.json();

    const faturaWherePut: any = { id: faturaId, userId: user.id };
    if (empresaId) faturaWherePut.empresaId = empresaId;

    const fatura = await prisma.fatura.findFirst({
      where: faturaWherePut,
      include: { cartao: true }
    });

    if (!fatura) {
      return NextResponse.json(
        { error: "Fatura não encontrada" },
        { status: 404 }
      );
    }

    if (fatura.pago) {
      return NextResponse.json(
        { error: "Fatura já foi paga" },
        { status: 400 }
      );
    }

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const mesNome = meses[fatura.mesReferencia - 1];

    // Usar mesReferencia/anoReferencia para consistência com GET
    const inicioMes = new Date(fatura.anoReferencia, fatura.mesReferencia - 1, 1, 0, 0, 0);
    const fimMes = new Date(fatura.anoReferencia, fatura.mesReferencia, 0, 23, 59, 59);

    // Executar todas as operações em uma transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar conta a pagar para a fatura
      const contaFatura = await tx.conta.create({
        data: {
          descricao: `Fatura ${fatura.cartao.nome} - ${mesNome}/${fatura.anoReferencia}`,
          valor: fatura.valorTotal,
          vencimento: fatura.dataVencimento,
          tipo: "pagar",
          pago: true,
          dataPagamento: new Date(),
          status: "pago",
          noFluxoCaixa: true,
          beneficiario: fatura.cartao.nome,
          codigoTipo: `FAT-${fatura.cartao.id}`,
          userId: user.id,
          empresaId: empresaId || undefined
        }
      });

      // 2. Marcar todas as contas da fatura como pagas (usando mesmo critério do GET)
      const updateContasWhere: any = {
        userId: user.id,
        cartaoId: fatura.cartaoId,
        vencimento: {
          gte: inicioMes,
          lte: fimMes
        },
        pago: false,
        OR: [
          { totalParcelas: null },
          { parentId: { not: null } },
        ]
      };
      if (empresaId) updateContasWhere.empresaId = empresaId;

      await tx.conta.updateMany({
        where: updateContasWhere,
        data: {
          pago: true,
          dataPagamento: new Date(),
          status: "pago"
        }
      });

      // 3. Atualizar fatura como paga
      const faturaAtualizada = await tx.fatura.update({
        where: { id: faturaId },
        data: {
          pago: true,
          dataPagamento: new Date(),
          contaFaturaId: contaFatura.id
        },
        include: { cartao: true }
      });

      // 4. Registrar no fluxo de caixa (se bancoId fornecido)
      if (data.bancoId) {
        const fluxoWhere: any = { userId: user.id };
        if (empresaId) fluxoWhere.empresaId = empresaId;

        const ultimoFluxo = await tx.fluxoCaixa.findFirst({
          where: fluxoWhere,
          orderBy: { dia: "desc" }
        });
        const saldoAnterior = ultimoFluxo?.fluxo || 0;

        await tx.fluxoCaixa.create({
          data: {
            dia: new Date(),
            codigoTipo: `FAT-${fatura.cartao.id}`,
            fornecedorCliente: fatura.cartao.nome,
            valor: fatura.valorTotal,
            tipo: "saida",
            fluxo: saldoAnterior - fatura.valorTotal,
            contaId: contaFatura.id,
            cartaoId: fatura.cartaoId, // Vincula o pagamento ao cartão
            bancoId: parseInt(data.bancoId),
            userId: user.id,
            empresaId: empresaId || undefined
          }
        });
      }

      return { contaFatura, faturaAtualizada };
    });

    console.log("✅ Fatura paga:", `${fatura.cartao.nome} - ${mesNome}/${fatura.anoReferencia}`);

    return NextResponse.json({
      success: true,
      message: "Fatura paga com sucesso",
      fatura: result.faturaAtualizada
    });
  } catch (error: any) {
    console.error("❌ Erro ao pagar fatura:", error);
    return NextResponse.json(
      { error: "Erro ao pagar fatura" },
      { status: 500 }
    );
  }
}
