import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

interface ContaBalancete {
  codigo: string;
  nome: string;
  valor: number;
  fornecedor?: string;
  subcontas?: ContaBalancete[];
}

interface CategoriaBalancete {
  codigo: string;
  nome: string;
  total: number;
  contas: ContaBalancete[];
}

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

    // Buscar todos os centros de custo do usuário
    const centrosWhere: { ativo: boolean; userId: number; empresaId?: number } = { ativo: true, userId: user.id };
    if (empresaId) centrosWhere.empresaId = empresaId;

    const centros = await prisma.centroCusto.findMany({
      where: centrosWhere,
      orderBy: { sigla: "asc" },
    });

    // Descrições de operações financeiras que devem ser excluídas dos relatórios
    const descricoesExcluidas = [
      "Utilização Conta Garantida",
      "Devolução Conta Garantida",
      "Resgate de Investimento",
      "Aplicação em Investimento",
    ];

    // Buscar fluxo de caixa do período
    const fluxoWhere: {
      userId: number;
      dia: { gte: Date; lte: Date };
      empresaId?: number;
    } = {
      userId: user.id,
      dia: {
        gte: inicioMesAtual,
        lte: fimMesAtual,
      },
    };
    if (empresaId) fluxoWhere.empresaId = empresaId;

    const fluxoCaixaRaw = await prisma.fluxoCaixa.findMany({
      where: fluxoWhere,
      orderBy: { dia: "asc" },
      include: {
        conta: {
          select: { descricao: true },
        },
      },
    });

    // Filtrar movimentações de Conta Garantida e Investimento (são operações financeiras, não receita/despesa)
    const fluxoCaixa = fluxoCaixaRaw.filter(
      (mov: typeof fluxoCaixaRaw[number]) => !mov.descricao || !descricoesExcluidas.includes(mov.descricao)
    );

    // Agrupar movimentações por centro de custo com detalhamento
    const agrupado: Record<string, {
      tipo: "entrada" | "saida";
      total: number;
      contas: Record<string, { valor: number; descricao: string; fornecedor: string }>;
    }> = {};

    for (const mov of fluxoCaixa) {
      const sigla = mov.centroCustoSigla || "SEM_CENTRO";

      if (!agrupado[sigla]) {
        agrupado[sigla] = {
          tipo: mov.tipo as "entrada" | "saida",
          total: 0,
          contas: {}
        };
      }

      // Garantir tratamento correto de null - usar descrição da conta vinculada como fallback
      const fornecedor = mov.fornecedorCliente ?? "Outros";
      const descricao = mov.descricao ?? mov.conta?.descricao ?? "";

      const chaveConta = `${fornecedor}|${descricao}`;

      if (!agrupado[sigla].contas[chaveConta]) {
        agrupado[sigla].contas[chaveConta] = {
          valor: 0,
          descricao: descricao,
          fornecedor: fornecedor,
        };
      }

      const valor = Number(mov.valor);
      agrupado[sigla].total += valor;
      agrupado[sigla].contas[chaveConta].valor += valor;
    }

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

    // Separar por tipo
    const centrosFaturamento = centrosPrincipais.filter((c: typeof centros[number]) => c.tipo === "faturamento");
    const centrosDespesa = centrosPrincipais.filter((c: typeof centros[number]) => c.tipo === "despesa");

    // Contador para gerar códigos numéricos
    let codigoReceita = 1;
    let codigoDespesa = 2;

    // Montar estrutura do balancete para receitas
    const receitas: CategoriaBalancete[] = [];

    for (const centro of centrosFaturamento) {
      const dadosCentro = agrupado[centro.sigla];
      if (!dadosCentro || dadosCentro.total === 0) continue;

      const categoria: CategoriaBalancete = {
        codigo: `1.${codigoReceita}`,
        nome: centro.nome,
        total: dadosCentro.total,
        contas: [],
      };

      // Adicionar contas do centro principal
      let subcodigo = 1;
      for (const [chave, conta] of Object.entries(dadosCentro.contas)) {
        if (conta.valor === 0) continue;

        categoria.contas.push({
          codigo: `1.${codigoReceita}.${subcodigo}`,
          nome: conta.descricao || centro.nome,
          valor: conta.valor,
          fornecedor: conta.fornecedor,
        });
        subcodigo++;
      }

      // Adicionar subcentros
      const subcentros = subcentrosMap.get(centro.id) || [];
      for (const sub of subcentros) {
        const dadosSub = agrupado[sub.sigla];
        if (!dadosSub || dadosSub.total === 0) continue;

        for (const [chave, conta] of Object.entries(dadosSub.contas)) {
          if (conta.valor === 0) continue;

          categoria.contas.push({
            codigo: `1.${codigoReceita}.${subcodigo}`,
            nome: conta.descricao || sub.nome,
            valor: conta.valor,
            fornecedor: conta.fornecedor,
          });
          subcodigo++;
        }
        categoria.total += dadosSub.total;
      }

      if (categoria.contas.length > 0) {
        receitas.push(categoria);
        codigoReceita++;
      }
    }

    // Receitas sem centro
    if (agrupado["SEM_CENTRO"] && agrupado["SEM_CENTRO"].tipo === "entrada" && agrupado["SEM_CENTRO"].total > 0) {
      const dadosSemCentro = agrupado["SEM_CENTRO"];
      const categoria: CategoriaBalancete = {
        codigo: `1.${codigoReceita}`,
        nome: "Outras Receitas",
        total: dadosSemCentro.total,
        contas: [],
      };

      let subcodigo = 1;
      for (const [chave, conta] of Object.entries(dadosSemCentro.contas)) {
        if (conta.valor === 0) continue;

        categoria.contas.push({
          codigo: `1.${codigoReceita}.${subcodigo}`,
          nome: conta.descricao || "Outros",
          valor: conta.valor,
          fornecedor: conta.fornecedor,
        });
        subcodigo++;
      }

      if (categoria.contas.length > 0) {
        receitas.push(categoria);
      }
    }

    // Montar estrutura do balancete para despesas
    const despesas: CategoriaBalancete[] = [];
    let despesaIdx = 1;

    for (const centro of centrosDespesa) {
      const dadosCentro = agrupado[centro.sigla];

      // Verificar se tem dados ou subcentros com dados
      const subcentros = subcentrosMap.get(centro.id) || [];
      const temDadosSubcentros = subcentros.some((sub: typeof centros[number]) => {
        const dados = agrupado[sub.sigla];
        return dados && dados.total > 0;
      });

      if ((!dadosCentro || dadosCentro.total === 0) && !temDadosSubcentros) continue;

      const categoria: CategoriaBalancete = {
        codigo: `2.${despesaIdx}`,
        nome: centro.nome,
        total: dadosCentro?.total || 0,
        contas: [],
      };

      // Adicionar contas do centro principal
      let subcodigo = 1;
      if (dadosCentro) {
        for (const [chave, conta] of Object.entries(dadosCentro.contas)) {
          if (conta.valor === 0) continue;

          categoria.contas.push({
            codigo: `2.${despesaIdx}.${subcodigo}`,
            nome: conta.descricao || centro.nome,
            valor: conta.valor,
            fornecedor: conta.fornecedor,
          });
          subcodigo++;
        }
      }

      // Adicionar subcentros
      for (const sub of subcentros) {
        const dadosSub = agrupado[sub.sigla];
        if (!dadosSub || dadosSub.total === 0) continue;

        for (const [chave, conta] of Object.entries(dadosSub.contas)) {
          if (conta.valor === 0) continue;

          categoria.contas.push({
            codigo: `2.${despesaIdx}.${subcodigo}`,
            nome: conta.descricao || sub.nome,
            valor: conta.valor,
            fornecedor: conta.fornecedor,
          });
          subcodigo++;
        }
        categoria.total += dadosSub.total;
      }

      if (categoria.contas.length > 0) {
        despesas.push(categoria);
        despesaIdx++;
      }
    }

    // Despesas sem centro
    const semCentroDespesa = fluxoCaixa.filter((f: typeof fluxoCaixa[number]) => !f.centroCustoSigla && f.tipo === "saida");
    if (semCentroDespesa.length > 0) {
      const dadosSemCentro: Record<string, { valor: number; descricao: string; fornecedor: string }> = {};
      let totalSemCentro = 0;

      for (const mov of semCentroDespesa) {
        const chaveConta = `${mov.fornecedorCliente || "Outros"}|${mov.descricao || ""}`;
        if (!dadosSemCentro[chaveConta]) {
          dadosSemCentro[chaveConta] = {
            valor: 0,
            descricao: mov.descricao || "",
            fornecedor: mov.fornecedorCliente || "Outros",
          };
        }
        const valor = Number(mov.valor);
        dadosSemCentro[chaveConta].valor += valor;
        totalSemCentro += valor;
      }

      if (totalSemCentro > 0) {
        const categoria: CategoriaBalancete = {
          codigo: `2.${despesaIdx}`,
          nome: "Outras Despesas",
          total: totalSemCentro,
          contas: [],
        };

        let subcodigo = 1;
        for (const [chave, conta] of Object.entries(dadosSemCentro)) {
          if (conta.valor === 0) continue;

          categoria.contas.push({
            codigo: `2.${despesaIdx}.${subcodigo}`,
            nome: conta.descricao || "Outros",
            valor: conta.valor,
            fornecedor: conta.fornecedor,
          });
          subcodigo++;
        }

        if (categoria.contas.length > 0) {
          despesas.push(categoria);
        }
      }
    }

    // Calcular totais
    const totalReceitas = receitas.reduce((acc, cat) => acc + cat.total, 0);
    const totalDespesas = despesas.reduce((acc, cat) => acc + cat.total, 0);

    // Buscar bancos para calcular saldos atuais
    const bancosWhere: { ativo: boolean; userId: number; empresaId?: number } = { ativo: true, userId: user.id };
    if (empresaId) bancosWhere.empresaId = empresaId;

    const bancos = await prisma.banco.findMany({
      where: bancosWhere,
      orderBy: { nome: "asc" },
    });

    // Buscar TODAS as movimentações (sem filtro de período) para calcular saldo atual
    const fluxoTotalWhere: { userId: number; empresaId?: number } = { userId: user.id };
    if (empresaId) fluxoTotalWhere.empresaId = empresaId;

    const fluxoCaixaTotal = await prisma.fluxoCaixa.findMany({
      where: fluxoTotalWhere,
    });

    // Calcular saldo por banco (saldo inicial + todas as movimentações)
    const saldosPorBanco: Record<number, number> = {};
    for (const banco of bancos) {
      const saldoInicial = Number(banco.saldoInicial) || 0;
      const movimentacoesBanco = fluxoCaixaTotal.filter((item: typeof fluxoCaixaTotal[number]) => item.bancoId === banco.id);
      const saldoMovimentacoes = movimentacoesBanco.reduce((total: number, item: typeof fluxoCaixaTotal[number]) => {
        if (item.tipo === "entrada") {
          return total + Number(item.valor);
        } else {
          return total - Number(item.valor);
        }
      }, 0);
      saldosPorBanco[banco.id] = saldoInicial + saldoMovimentacoes;
    }

    // Calcular totais dos bancos
    const saldoTotalBancos = Object.values(saldosPorBanco).reduce((acc, saldo) => acc + saldo, 0);
    const totalInvestimentoLiquido = bancos.reduce((acc: number, banco: typeof bancos[number]) => acc + (Number(banco.saldoInvestimentoLiquido) || 0), 0);
    const saldoLiquido = saldoTotalBancos + totalInvestimentoLiquido;

    // Formatação das datas para exibição
    const formatarData = (data: Date) => {
      return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };
    const periodo = `${formatarData(inicioMesAtual)} - ${formatarData(fimMesAtual)}`;

    return NextResponse.json({
      periodo,
      receitas,
      despesas,
      totais: {
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
      },
      saldos: {
        contas: saldoTotalBancos,
        investimentos: totalInvestimentoLiquido,
        liquido: saldoLiquido,
      },
    });
  } catch (error) {
    console.error("Error fetching Balancete data:", error);
    return NextResponse.json({ error: "Failed to fetch Balancete data" }, { status: 500 });
  }
}
