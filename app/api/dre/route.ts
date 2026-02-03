import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const mesAtual = searchParams.get("mes") || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Calcular mês anterior
    const [ano, mes] = mesAtual.split("-").map(Number);
    const dataAtual = new Date(ano, mes - 1, 1);
    const dataAnterior = new Date(ano, mes - 2, 1);
    const mesAnterior = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, "0")}`;

    // Buscar todos os centros de custo do usuário
    const centrosWhere: { ativo: boolean; userId: number; empresaId?: number } = { ativo: true, userId: user.id };
    if (empresaId) centrosWhere.empresaId = empresaId;

    const centros = await prisma.centroCusto.findMany({
      where: centrosWhere,
      orderBy: { sigla: "asc" },
    });

    // Buscar fluxo de caixa do mês atual
    const inicioMesAtual = new Date(ano, mes - 1, 1);
    const fimMesAtual = new Date(ano, mes, 0, 23, 59, 59);

    const fluxoAtualWhere: { userId: number; dia: { gte: Date; lte: Date }; empresaId?: number } = {
      userId: user.id,
      dia: {
        gte: inicioMesAtual,
        lte: fimMesAtual,
      },
    };
    if (empresaId) fluxoAtualWhere.empresaId = empresaId;

    const fluxoAtual = await prisma.fluxoCaixa.findMany({
      where: fluxoAtualWhere,
    });

    // Buscar fluxo de caixa do mês anterior
    const inicioMesAnterior = new Date(dataAnterior.getFullYear(), dataAnterior.getMonth(), 1);
    const fimMesAnterior = new Date(dataAnterior.getFullYear(), dataAnterior.getMonth() + 1, 0, 23, 59, 59);

    const fluxoAnteriorWhere: { userId: number; dia: { gte: Date; lte: Date }; empresaId?: number } = {
      userId: user.id,
      dia: {
        gte: inicioMesAnterior,
        lte: fimMesAnterior,
      },
    };
    if (empresaId) fluxoAnteriorWhere.empresaId = empresaId;

    const fluxoAnterior = await prisma.fluxoCaixa.findMany({
      where: fluxoAnteriorWhere,
    });

    // Agrupar movimentações por centro de custo
    function agruparPorCentro(fluxo: any[]) {
      const agrupado: Record<string, { entradas: number; saidas: number }> = {};

      for (const mov of fluxo) {
        const sigla = mov.centroCustoSigla || "SEM_CENTRO";
        if (!agrupado[sigla]) {
          agrupado[sigla] = { entradas: 0, saidas: 0 };
        }
        if (mov.tipo === "entrada") {
          agrupado[sigla].entradas += Number(mov.valor);
        } else {
          agrupado[sigla].saidas += Number(mov.valor);
        }
      }

      return agrupado;
    }

    const dadosAtual = agruparPorCentro(fluxoAtual);
    const dadosAnterior = agruparPorCentro(fluxoAnterior);

    // Separar centros por tipo
    const centrosFaturamento = centros.filter((c: typeof centros[number]) => c.tipo === "faturamento");
    const centrosDespesa = centros.filter((c: typeof centros[number]) => c.tipo === "despesa");

    // Montar estrutura da DRE
    const receitaBruta = centrosFaturamento.map((centro: typeof centros[number]) => ({
      sigla: centro.sigla,
      name: centro.nome,
      atual: dadosAtual[centro.sigla]?.entradas || 0,
      anterior: dadosAnterior[centro.sigla]?.entradas || 0,
    }));

    // Adicionar receitas sem centro definido
    if (dadosAtual["SEM_CENTRO"]?.entradas || dadosAnterior["SEM_CENTRO"]?.entradas) {
      receitaBruta.push({
        sigla: "SEM_CENTRO",
        name: "Outras Receitas (sem centro)",
        atual: dadosAtual["SEM_CENTRO"]?.entradas || 0,
        anterior: dadosAnterior["SEM_CENTRO"]?.entradas || 0,
      });
    }

    // Despesas operacionais (todos os centros de despesa)
    const despesasOperacionais = centrosDespesa.map((centro: typeof centros[number]) => ({
      sigla: centro.sigla,
      name: centro.nome,
      atual: -(dadosAtual[centro.sigla]?.saidas || 0),
      anterior: -(dadosAnterior[centro.sigla]?.saidas || 0),
    }));

    // Adicionar despesas sem centro definido
    if (dadosAtual["SEM_CENTRO"]?.saidas || dadosAnterior["SEM_CENTRO"]?.saidas) {
      despesasOperacionais.push({
        sigla: "SEM_CENTRO",
        name: "Outras Despesas (sem centro)",
        atual: -(dadosAtual["SEM_CENTRO"]?.saidas || 0),
        anterior: -(dadosAnterior["SEM_CENTRO"]?.saidas || 0),
      });
    }

    // Calcular totais
    const totalReceitaAtual = receitaBruta.reduce((acc: number, item: { atual: number }) => acc + item.atual, 0);
    const totalReceitaAnterior = receitaBruta.reduce((acc: number, item: { anterior: number }) => acc + item.anterior, 0);
    const totalDespesasAtual = despesasOperacionais.reduce((acc: number, item: { atual: number }) => acc + item.atual, 0);
    const totalDespesasAnterior = despesasOperacionais.reduce((acc: number, item: { anterior: number }) => acc + item.anterior, 0);

    // Nomes dos meses para exibição
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const nomeMesAtual = `${meses[mes - 1]}/${ano}`;
    const nomeMesAnterior = `${meses[dataAnterior.getMonth()]}/${dataAnterior.getFullYear()}`;

    return NextResponse.json({
      mesAtual: nomeMesAtual,
      mesAnterior: nomeMesAnterior,
      receitaBruta: receitaBruta.filter((r: { atual: number; anterior: number }) => r.atual !== 0 || r.anterior !== 0),
      despesasOperacionais: despesasOperacionais.filter((d: { atual: number; anterior: number }) => d.atual !== 0 || d.anterior !== 0),
      totais: {
        receitaBruta: { atual: totalReceitaAtual, anterior: totalReceitaAnterior },
        despesas: { atual: totalDespesasAtual, anterior: totalDespesasAnterior },
        resultado: {
          atual: totalReceitaAtual + totalDespesasAtual,
          anterior: totalReceitaAnterior + totalDespesasAnterior
        },
      },
    });
  } catch (error) {
    console.error("Error fetching DRE data:", error);
    return NextResponse.json({ error: "Failed to fetch DRE data" }, { status: 500 });
  }
}
