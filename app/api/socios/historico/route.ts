import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Buscar histórico de pró-labore
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const socioId = searchParams.get("socioId");
    const ano = searchParams.get("ano");

    const hoje = new Date();
    const anoReferencia = ano ? parseInt(ano) : hoje.getFullYear();

    // Construir where baseado nos parâmetros
    const where: any = {
      userId: user.id,
      anoReferencia,
    };

    if (empresaId) where.empresaId = empresaId;

    if (socioId) {
      where.socioId = parseInt(socioId);
    }

    // Buscar histórico
    const historico = await prisma.historicoProLabore.findMany({
      where,
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" },
      ],
    });

    // Formatar resposta
    const historicoFormatado = historico.map((h: any) => ({
      id: h.id,
      mesReferencia: h.mesReferencia,
      anoReferencia: h.anoReferencia,
      periodo: `${h.mesReferencia.toString().padStart(2, '0')}/${h.anoReferencia}`,
      socioId: h.socioId,
      socioNome: h.socioNome,
      socioCpf: h.socioCpf,
      proLaboreBase: h.proLaboreBase,
      totalDescontos: h.totalDescontos,
      proLaboreLiquido: h.proLaboreLiquido,
      descontos: h.descontosJson ? JSON.parse(h.descontosJson) : [],
      contaGeradaId: h.contaGeradaId,
      pago: h.pago,
      dataPagamento: h.dataPagamento,
      criadoEm: h.criadoEm,
    }));

    // Calcular totais
    const totais = {
      totalBase: historico.reduce((acc: number, h: any) => acc + h.proLaboreBase, 0),
      totalDescontos: historico.reduce((acc: number, h: any) => acc + h.totalDescontos, 0),
      totalLiquido: historico.reduce((acc: number, h: any) => acc + h.proLaboreLiquido, 0),
      quantidadeRegistros: historico.length,
    };

    // Agrupar por mês
    const porMes: { [key: string]: any[] } = {};
    historicoFormatado.forEach((h: any) => {
      const chave = h.periodo;
      if (!porMes[chave]) {
        porMes[chave] = [];
      }
      porMes[chave].push(h);
    });

    return NextResponse.json({
      anoReferencia,
      historico: historicoFormatado,
      porMes,
      totais,
    });

  } catch (error: any) {
    console.error("Erro ao buscar histórico de pró-labore:", error);
    return NextResponse.json({
      error: "Falha ao buscar histórico",
      details: error.message
    }, { status: 500 });
  }
}
