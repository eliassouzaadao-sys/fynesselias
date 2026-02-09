import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Listar faturas de um cartão
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
    const cartaoId = parseInt(id);

    if (isNaN(cartaoId)) {
      return NextResponse.json(
        { error: "ID do cartão inválido" },
        { status: 400 }
      );
    }

    // Buscar cartão (verificando se pertence ao usuário)
    const cartaoWhere: any = { id: cartaoId, userId: user.id };
    if (empresaId) cartaoWhere.empresaId = empresaId;

    const cartao = await prisma.cartaoCredito.findFirst({
      where: cartaoWhere
    });

    if (!cartao) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    // Garantir que a fatura do mês atual existe
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const faturaAtualWhere: any = {
      cartaoId: cartao.id,
      mesReferencia: mesAtual,
      anoReferencia: anoAtual,
      userId: user.id
    };
    if (empresaId) faturaAtualWhere.empresaId = empresaId;

    const faturaAtualExiste = await prisma.fatura.findFirst({
      where: faturaAtualWhere
    });

    if (!faturaAtualExiste) {
      // Criar fatura do mês atual (mês de uso)
      // O fechamento e vencimento são no mês SEGUINTE ao mês de uso
      let mesFechamento = mesAtual + 1;
      let anoFechamento = anoAtual;
      if (mesFechamento > 12) {
        mesFechamento = 1;
        anoFechamento += 1;
      }
      const dataFechamento = new Date(anoFechamento, mesFechamento - 1, cartao.diaFechamento, 23, 59, 59);
      const dataVencimento = new Date(anoFechamento, mesFechamento - 1, cartao.diaVencimento);

      await prisma.fatura.create({
        data: {
          cartaoId: cartao.id,
          mesReferencia: mesAtual,
          anoReferencia: anoAtual,
          valorTotal: 0,
          dataFechamento,
          dataVencimento,
          userId: user.id,
          empresaId: empresaId || undefined
        }
      });
    }

    // Filtro por ano (opcional)
    const { searchParams } = new URL(request.url);
    const ano = searchParams.get("ano");

    // Filtrar apenas faturas até o mês atual (não mostrar futuras)
    const whereClause: any = {
      cartaoId,
      userId: user.id,
      OR: [
        { anoReferencia: { lt: anoAtual } },
        {
          anoReferencia: anoAtual,
          mesReferencia: { lte: mesAtual }
        }
      ]
    };
    if (empresaId) whereClause.empresaId = empresaId;
    if (ano) {
      whereClause.anoReferencia = parseInt(ano);
    }

    const faturas = await prisma.fatura.findMany({
      where: whereClause,
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" }
      ],
      include: {
        cartao: {
          select: { nome: true, bandeira: true, ultimos4Digitos: true }
        }
      }
    });

    // Contar lançamentos de cada fatura (pelo mês de uso)
    const faturasComContagem = await Promise.all(
      faturas.map(async (fatura: typeof faturas[number]) => {
        // Buscar contas com vencimento no mês de referência (mês de uso)
        const inicioMes = new Date(fatura.anoReferencia, fatura.mesReferencia - 1, 1, 0, 0, 0);
        const fimMes = new Date(fatura.anoReferencia, fatura.mesReferencia, 0, 23, 59, 59);

        const contagemWhere: any = {
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
        if (empresaId) contagemWhere.empresaId = empresaId;

        const contagem = await prisma.conta.count({
          where: contagemWhere
        });

        return {
          ...fatura,
          quantidadeLancamentos: contagem
        };
      })
    );

    return NextResponse.json(faturasComContagem);
  } catch (error) {
    console.error("❌ Erro ao buscar faturas:", error);
    return NextResponse.json([]);
  }
}
