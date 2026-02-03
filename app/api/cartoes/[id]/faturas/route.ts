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

    // Filtro por ano (opcional)
    const { searchParams } = new URL(request.url);
    const ano = searchParams.get("ano");

    const whereClause: any = { cartaoId, userId: user.id };
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

    // Contar lançamentos de cada fatura
    const faturasComContagem = await Promise.all(
      faturas.map(async (fatura: typeof faturas[number]) => {
        const contagemWhere: any = {
          userId: user.id,
          cartaoId: fatura.cartaoId,
          vencimento: {
            gte: fatura.dataFechamento,
            lt: fatura.dataVencimento
          }
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
