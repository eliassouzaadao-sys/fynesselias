import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";
import { HistoricoFolha } from "@prisma/client";

// GET - Histórico geral de folha de pagamento
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    // Extrair parâmetros de filtro
    const { searchParams } = new URL(request.url);
    const ano = searchParams.get('ano');
    const funcionarioId = searchParams.get('funcionarioId');

    // Construir filtro
    const where: any = {
      userId: user.id,
    };
    if (empresaId) where.empresaId = empresaId;
    if (ano) where.anoReferencia = parseInt(ano);
    if (funcionarioId) where.funcionarioId = parseInt(funcionarioId);

    // Buscar histórico
    const historico = await prisma.historicoFolha.findMany({
      where,
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" },
        { funcionarioNome: "asc" },
      ],
    });

    // Agrupar por mês/ano
    const porMes: Record<string, HistoricoFolha[]> = {};
    historico.forEach((item: HistoricoFolha) => {
      const key = `${item.mesReferencia.toString().padStart(2, '0')}/${item.anoReferencia}`;
      if (!porMes[key]) {
        porMes[key] = [];
      }
      porMes[key].push(item);
    });

    // Calcular totais
    const totais = {
      totalBruto: historico.reduce((acc: number, h: HistoricoFolha) => acc + h.salarioBruto, 0),
      totalLiquido: historico.reduce((acc: number, h: HistoricoFolha) => acc + h.salarioLiquido, 0),
      totalCustoEmpresa: historico.reduce((acc: number, h: HistoricoFolha) => acc + h.custoEmpresa, 0),
      totalInss: historico.reduce((acc: number, h: HistoricoFolha) => acc + h.inss, 0),
      totalIrrf: historico.reduce((acc: number, h: HistoricoFolha) => acc + h.irrf, 0),
      totalFgts: historico.reduce((acc: number, h: HistoricoFolha) => acc + h.fgts, 0),
      quantidadeRegistros: historico.length,
      quantidadePagos: historico.filter((h: HistoricoFolha) => h.pago).length,
    };

    // Calcular totais por mês
    const totaisPorMes: Record<string, any> = {};
    Object.entries(porMes).forEach(([key, items]: [string, HistoricoFolha[]]) => {
      totaisPorMes[key] = {
        totalBruto: items.reduce((acc: number, h: HistoricoFolha) => acc + h.salarioBruto, 0),
        totalLiquido: items.reduce((acc: number, h: HistoricoFolha) => acc + h.salarioLiquido, 0),
        totalCustoEmpresa: items.reduce((acc: number, h: HistoricoFolha) => acc + h.custoEmpresa, 0),
        quantidadeFuncionarios: items.length,
        quantidadePagos: items.filter((h: HistoricoFolha) => h.pago).length,
      };
    });

    return NextResponse.json({
      anoReferencia: ano ? parseInt(ano) : new Date().getFullYear(),
      historico,
      porMes,
      totaisPorMes,
      totais,
    });
  } catch (error) {
    console.error("Error fetching histórico de folha:", error);
    return NextResponse.json({ error: "Falha ao buscar histórico" }, { status: 500 });
  }
}
