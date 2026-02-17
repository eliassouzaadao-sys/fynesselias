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

    // Aceitar filtros de período
    const dataInicioParam = searchParams.get("dataInicio");
    const dataFimParam = searchParams.get("dataFim");

    // Se não fornecidos, usar o mês atual
    const hoje = new Date();
    const inicioMesAtual = dataInicioParam
      ? new Date(dataInicioParam + "T00:00:00")
      : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMesAtual = dataFimParam
      ? new Date(dataFimParam + "T23:59:59")
      : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    // Calcular período anterior de mesma duração para comparação
    const duracaoDias = Math.ceil((fimMesAtual.getTime() - inicioMesAtual.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const inicioMesAnterior = new Date(inicioMesAtual);
    inicioMesAnterior.setDate(inicioMesAnterior.getDate() - duracaoDias);
    const fimMesAnterior = new Date(inicioMesAtual);
    fimMesAnterior.setDate(fimMesAnterior.getDate() - 1);
    fimMesAnterior.setHours(23, 59, 59);

    // Buscar todos os centros de custo do usuário
    const centrosWhere: { ativo: boolean; userId: number; empresaId?: number } = { ativo: true, userId: user.id };
    if (empresaId) centrosWhere.empresaId = empresaId;

    const centros = await prisma.centroCusto.findMany({
      where: centrosWhere,
      orderBy: { sigla: "asc" },
    });

    // Buscar fluxo de caixa do período atual
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

    // Buscar fluxo de caixa do período anterior
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

    // Agrupar movimentações por centro de custo com detalhamento por conta
    function agruparPorCentroComDetalhe(fluxo: any[]) {
      const agrupado: Record<string, {
        entradas: number;
        saidas: number;
        contas: Record<string, { valor: number; descricao: string; fornecedor: string }>;
      }> = {};

      for (const mov of fluxo) {
        const sigla = mov.centroCustoSigla || "SEM_CENTRO";
        if (!agrupado[sigla]) {
          agrupado[sigla] = { entradas: 0, saidas: 0, contas: {} };
        }

        // Chave única para agrupar contas similares
        const chaveConta = `${mov.fornecedorCliente || "Outros"}|${mov.descricao || ""}`;

        if (!agrupado[sigla].contas[chaveConta]) {
          agrupado[sigla].contas[chaveConta] = {
            valor: 0,
            descricao: mov.descricao || "",
            fornecedor: mov.fornecedorCliente || "Outros",
          };
        }

        if (mov.tipo === "entrada") {
          agrupado[sigla].entradas += Number(mov.valor);
          agrupado[sigla].contas[chaveConta].valor += Number(mov.valor);
        } else {
          agrupado[sigla].saidas += Number(mov.valor);
          agrupado[sigla].contas[chaveConta].valor -= Number(mov.valor);
        }
      }

      return agrupado;
    }

    const dadosAtual = agruparPorCentroComDetalhe(fluxoAtual);
    const dadosAnterior = agruparPorCentroComDetalhe(fluxoAnterior);

    // Separar centros principais (sem parent) e subcentros
    const centrosPrincipais = centros.filter((c: typeof centros[number]) => !c.parentId);
    const subcentrosMap = new Map<number, typeof centros>();
    centros.forEach((c: typeof centros[number]) => {
      if (c.parentId) {
        if (!subcentrosMap.has(c.parentId)) {
          subcentrosMap.set(c.parentId, []);
        }
        subcentrosMap.get(c.parentId)!.push(c);
      }
    });

    // Separar centros por tipo
    const centrosFaturamento = centrosPrincipais.filter((c: typeof centros[number]) => c.tipo === "faturamento");
    const centrosDespesa = centrosPrincipais.filter((c: typeof centros[number]) => c.tipo === "despesa");

    // Função para montar contas detalhadas de um centro
    function montarContasDetalhe(sigla: string, tipo: "entrada" | "saida") {
      const contasAtual = dadosAtual[sigla]?.contas || {};
      const contasAnterior = dadosAnterior[sigla]?.contas || {};

      // Combinar todas as chaves
      const todasChaves = new Set([...Object.keys(contasAtual), ...Object.keys(contasAnterior)]);

      return Array.from(todasChaves).map((chave) => {
        const [fornecedor, descricao] = chave.split("|");
        const valorAtual = contasAtual[chave]?.valor || 0;
        const valorAnterior = contasAnterior[chave]?.valor || 0;

        return {
          fornecedor,
          descricao,
          atual: tipo === "entrada" ? Math.abs(valorAtual) : valorAtual,
          anterior: tipo === "entrada" ? Math.abs(valorAnterior) : valorAnterior,
        };
      }).filter(c => c.atual !== 0 || c.anterior !== 0);
    }

    // Montar estrutura da DRE com hierarquia
    const receitaBruta = centrosFaturamento.map((centro: typeof centros[number]) => {
      const subcentros = subcentrosMap.get(centro.id) || [];
      const subcentrosData = subcentros.map((sub: typeof centros[number]) => ({
        sigla: sub.sigla,
        name: sub.nome,
        atual: dadosAtual[sub.sigla]?.entradas || 0,
        anterior: dadosAnterior[sub.sigla]?.entradas || 0,
        contas: montarContasDetalhe(sub.sigla, "entrada"),
      }));

      return {
        sigla: centro.sigla,
        name: centro.nome,
        atual: dadosAtual[centro.sigla]?.entradas || 0,
        anterior: dadosAnterior[centro.sigla]?.entradas || 0,
        contas: montarContasDetalhe(centro.sigla, "entrada"),
        subcentros: subcentrosData.filter((s: { atual: number; anterior: number }) => s.atual !== 0 || s.anterior !== 0),
      };
    });

    // Adicionar receitas sem centro definido
    if (dadosAtual["SEM_CENTRO"]?.entradas || dadosAnterior["SEM_CENTRO"]?.entradas) {
      receitaBruta.push({
        sigla: "SEM_CENTRO",
        name: "Outras Receitas (sem centro)",
        atual: dadosAtual["SEM_CENTRO"]?.entradas || 0,
        anterior: dadosAnterior["SEM_CENTRO"]?.entradas || 0,
        contas: montarContasDetalhe("SEM_CENTRO", "entrada"),
        subcentros: [],
      });
    }

    // Despesas operacionais com hierarquia
    const despesasOperacionais = centrosDespesa.map((centro: typeof centros[number]) => {
      const subcentros = subcentrosMap.get(centro.id) || [];
      const subcentrosData = subcentros.map((sub: typeof centros[number]) => ({
        sigla: sub.sigla,
        name: sub.nome,
        atual: -(dadosAtual[sub.sigla]?.saidas || 0),
        anterior: -(dadosAnterior[sub.sigla]?.saidas || 0),
        contas: montarContasDetalhe(sub.sigla, "saida"),
      }));

      return {
        sigla: centro.sigla,
        name: centro.nome,
        atual: -(dadosAtual[centro.sigla]?.saidas || 0),
        anterior: -(dadosAnterior[centro.sigla]?.saidas || 0),
        contas: montarContasDetalhe(centro.sigla, "saida"),
        subcentros: subcentrosData.filter((s: { atual: number; anterior: number }) => s.atual !== 0 || s.anterior !== 0),
      };
    });

    // Adicionar despesas sem centro definido
    if (dadosAtual["SEM_CENTRO"]?.saidas || dadosAnterior["SEM_CENTRO"]?.saidas) {
      despesasOperacionais.push({
        sigla: "SEM_CENTRO",
        name: "Outras Despesas (sem centro)",
        atual: -(dadosAtual["SEM_CENTRO"]?.saidas || 0),
        anterior: -(dadosAnterior["SEM_CENTRO"]?.saidas || 0),
        contas: montarContasDetalhe("SEM_CENTRO", "saida"),
        subcentros: [],
      });
    }

    // Calcular totais
    const totalReceitaAtual = receitaBruta.reduce((acc: number, item: { atual: number }) => acc + item.atual, 0);
    const totalReceitaAnterior = receitaBruta.reduce((acc: number, item: { anterior: number }) => acc + item.anterior, 0);
    const totalDespesasAtual = despesasOperacionais.reduce((acc: number, item: { atual: number }) => acc + item.atual, 0);
    const totalDespesasAnterior = despesasOperacionais.reduce((acc: number, item: { anterior: number }) => acc + item.anterior, 0);

    // Formatação das datas para exibição
    const formatarData = (data: Date) => {
      return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };
    const periodoAtual = `${formatarData(inicioMesAtual)} - ${formatarData(fimMesAtual)}`;
    const periodoAnterior = `${formatarData(inicioMesAnterior)} - ${formatarData(fimMesAnterior)}`;

    return NextResponse.json({
      mesAtual: periodoAtual,
      mesAnterior: periodoAnterior,
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
