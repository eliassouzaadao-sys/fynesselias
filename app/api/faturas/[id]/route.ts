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

    // Buscar lançamentos (contas) vinculados ao cartão que caem nesta fatura
    const lancamentosWhere: any = {
      userId: user.id,
      cartaoId: fatura.cartaoId,
      vencimento: {
        gte: new Date(fatura.dataFechamento.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias antes do fechamento
        lte: fatura.dataFechamento
      }
    };
    if (empresaId) lancamentosWhere.empresaId = empresaId;

    const lancamentos = await prisma.conta.findMany({
      where: lancamentosWhere,
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        descricao: true,
        valor: true,
        vencimento: true,
        beneficiario: true,
        numeroParcela: true,
        pago: true,
        criadoEm: true
      }
    });

    return NextResponse.json({
      ...fatura,
      lancamentos
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

    // 1. Criar conta a pagar para a fatura
    const contaFatura = await prisma.conta.create({
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

    // 2. Marcar todas as contas da fatura como pagas
    const updateContasWhere: any = {
      userId: user.id,
      cartaoId: fatura.cartaoId,
      vencimento: {
        gte: new Date(fatura.dataFechamento.getTime() - 30 * 24 * 60 * 60 * 1000),
        lte: fatura.dataFechamento
      },
      pago: false
    };
    if (empresaId) updateContasWhere.empresaId = empresaId;

    await prisma.conta.updateMany({
      where: updateContasWhere,
      data: {
        pago: true,
        dataPagamento: new Date(),
        status: "pago"
      }
    });

    // 3. Atualizar fatura
    const faturaAtualizada = await prisma.fatura.update({
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
      // Buscar último fluxo para calcular saldo
      const fluxoWhere: any = { userId: user.id };
      if (empresaId) fluxoWhere.empresaId = empresaId;

      const ultimoFluxo = await prisma.fluxoCaixa.findFirst({
        where: fluxoWhere,
        orderBy: { dia: "desc" }
      });
      const saldoAnterior = ultimoFluxo?.fluxo || 0;

      await prisma.fluxoCaixa.create({
        data: {
          dia: new Date(),
          codigoTipo: `FAT-${fatura.cartao.id}`,
          fornecedorCliente: fatura.cartao.nome,
          valor: fatura.valorTotal,
          tipo: "saida",
          fluxo: saldoAnterior - fatura.valorTotal,
          contaId: contaFatura.id,
          bancoId: parseInt(data.bancoId),
          userId: user.id,
          empresaId: empresaId || undefined
        }
      });
    }

    console.log("✅ Fatura paga:", `${fatura.cartao.nome} - ${mesNome}/${fatura.anoReferencia}`);

    return NextResponse.json({
      success: true,
      message: "Fatura paga com sucesso",
      fatura: faturaAtualizada
    });
  } catch (error: any) {
    console.error("❌ Erro ao pagar fatura:", error);
    return NextResponse.json(
      { error: "Erro ao pagar fatura" },
      { status: 500 }
    );
  }
}
