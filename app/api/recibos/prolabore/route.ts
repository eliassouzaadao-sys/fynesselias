import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// Funcao auxiliar para calcular descontos de um socio em tempo real
async function calcularDescontosSocio(
  socioId: number,
  userId: number,
  empresaId: number | null,
  mes: number,
  ano: number
) {
  const primeiroDiaMes = new Date(ano, mes - 1, 1, 0, 0, 0);
  const ultimoDiaMes = new Date(ano, mes, 0, 23, 59, 59);

  // 1. Buscar descontos recorrentes (INSS, plano saude, etc)
  const whereDescontosRec: any = {
    socioId,
    userId,
    ativo: true,
  };
  if (empresaId) whereDescontosRec.empresaId = empresaId;

  const descontosRecorrentes = await prisma.descontoRecorrente.findMany({
    where: whereDescontosRec,
  });

  const descontosRecorrentesTotal = descontosRecorrentes.reduce(
    (acc: number, d: any) => acc + Number(d.valor), 0
  );

  // 2. Buscar contas pendentes do socio no mes (previstos variaveis)
  const whereContasPend: any = {
    userId,
    socioResponsavelId: socioId,
    pago: false,
    status: { not: "cancelado" },
    vencimento: { gte: primeiroDiaMes, lte: ultimoDiaMes },
  };
  if (empresaId) whereContasPend.empresaId = empresaId;

  const contasPendentes = await prisma.conta.findMany({
    where: whereContasPend,
    select: { id: true, descricao: true, valor: true, parentId: true, totalParcelas: true },
  });

  const contasValidasPend = contasPendentes.filter((c: any) => {
    if (c.parentId !== null) return true;
    if (c.parentId === null && c.totalParcelas === null) return true;
    return false;
  });

  const descontosVariaveis = contasValidasPend.reduce(
    (acc: number, c: any) => acc + Number(c.valor), 0
  );

  // 3. Buscar contas pagas do socio no mes (descontos reais)
  const whereContasPagas: any = {
    userId,
    socioResponsavelId: socioId,
    pago: true,
    status: { not: "cancelado" },
    vencimento: { gte: primeiroDiaMes, lte: ultimoDiaMes },
  };
  if (empresaId) whereContasPagas.empresaId = empresaId;

  const contasPagas = await prisma.conta.findMany({
    where: whereContasPagas,
    select: { id: true, descricao: true, valor: true, parentId: true, totalParcelas: true },
  });

  const contasValidasPagas = contasPagas.filter((c: any) => {
    if (c.parentId !== null) return true;
    if (c.parentId === null && c.totalParcelas === null) return true;
    return false;
  });

  const descontosReaisContas = contasValidasPagas.reduce(
    (acc: number, c: any) => acc + Number(c.valor), 0
  );

  const descontosPrevistos = descontosRecorrentesTotal + descontosVariaveis;
  const descontosReais = descontosReaisContas;

  return {
    descontosPrevistos,
    descontosReais,
    totalDescontos: descontosPrevistos + descontosReais,
    descontosRecorrentes,
  };
}

// GET - Buscar historico de pro-labore para geracao de recibos
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    // Extrair parametros
    const { searchParams } = new URL(request.url);
    const ano = searchParams.get('ano') || new Date().getFullYear().toString();
    const socioId = searchParams.get('socioId');
    const mes = searchParams.get('mes');

    const anoNum = parseInt(ano);
    const mesNum = mes ? parseInt(mes) : null;

    // Construir filtro para historico existente
    const where: any = {
      userId: user.id,
      anoReferencia: anoNum,
    };
    if (empresaId) where.empresaId = empresaId;
    if (socioId && socioId !== 'todos') where.socioId = parseInt(socioId);
    if (mesNum) where.mesReferencia = mesNum;

    // Buscar historico de pro-labore existente
    const historico = await prisma.historicoProLabore.findMany({
      where,
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" },
        { socioNome: "asc" },
      ],
    });

    // Formatar historico existente
    const historicoFormatado = historico.map((item: any) => {
      let descontosPrevistosList: any[] = [];
      let descontosReaisList: any[] = [];

      if (item.descontosPrevistosJson) {
        try { descontosPrevistosList = JSON.parse(item.descontosPrevistosJson); } catch (e) {}
      }
      if (item.descontosReaisJson) {
        try { descontosReaisList = JSON.parse(item.descontosReaisJson); } catch (e) {}
      }

      return {
        id: item.id,
        mesReferencia: item.mesReferencia,
        anoReferencia: item.anoReferencia,
        socioId: item.socioId,
        socioNome: item.socioNome,
        socioCpf: item.socioCpf,
        proLaboreBase: item.proLaboreBase,
        totalDescontos: item.totalDescontos,
        proLaboreLiquido: item.proLaboreLiquido,
        descontosPrevistos: item.descontosPrevistos || 0,
        descontosReais: item.descontosReais || 0,
        descontosPrevistosJson: item.descontosPrevistosJson,
        descontosReaisJson: item.descontosReaisJson,
        descontosPrevistosLista: descontosPrevistosList,
        descontosReaisLista: descontosReaisList,
        pago: item.pago,
        dataPagamento: item.dataPagamento,
        contaGeradaId: item.contaGeradaId,
        criadoEm: item.criadoEm,
        isTempoReal: false,
      };
    });

    // Gerar recibos em tempo real para meses sem historico
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // Buscar socios ativos
    const whereSocios: any = {
      isSocio: true,
      ativo: true,
      userId: user.id,
    };
    if (empresaId) whereSocios.empresaId = empresaId;
    if (socioId && socioId !== 'todos') whereSocios.id = parseInt(socioId);

    const socios = await prisma.centroCusto.findMany({
      where: whereSocios,
    });

    // Para cada socio, verificar se tem historico do mes/ano selecionado
    // Se nao tiver, gerar dados em tempo real
    const mesesParaGerar = mesNum ? [mesNum] : Array.from({ length: 12 }, (_, i) => i + 1);

    for (const socio of socios) {
      for (const mesGerar of mesesParaGerar) {
        // Nao gerar para meses futuros
        if (anoNum > anoAtual || (anoNum === anoAtual && mesGerar > mesAtual)) {
          continue;
        }

        // Verificar se ja tem historico para este mes/ano
        const jaTemHistorico = historicoFormatado.some(
          (h: any) => h.socioId === socio.id && h.mesReferencia === mesGerar && h.anoReferencia === anoNum
        );

        if (!jaTemHistorico) {
          // Calcular descontos em tempo real
          const descontos = await calcularDescontosSocio(
            socio.id,
            user.id,
            empresaId,
            mesGerar,
            anoNum
          );

          const proLaboreBase = socio.previsto;
          const proLaboreLiquido = proLaboreBase - descontos.totalDescontos;

          historicoFormatado.push({
            id: `temp-${socio.id}-${mesGerar}-${anoNum}`,
            mesReferencia: mesGerar,
            anoReferencia: anoNum,
            socioId: socio.id,
            socioNome: socio.nome,
            socioCpf: socio.cpfSocio,
            proLaboreBase,
            totalDescontos: descontos.totalDescontos,
            proLaboreLiquido,
            descontosPrevistos: descontos.descontosPrevistos,
            descontosReais: descontos.descontosReais,
            descontosPrevistosJson: null,
            descontosReaisJson: null,
            descontosPrevistosLista: [],
            descontosReaisLista: [],
            pago: false,
            dataPagamento: null,
            contaGeradaId: null,
            criadoEm: null,
            isTempoReal: true, // Indica que e dados em tempo real, nao historico
          });
        }
      }
    }

    // Ordenar por mes/ano decrescente
    historicoFormatado.sort((a: any, b: any) => {
      if (b.anoReferencia !== a.anoReferencia) return b.anoReferencia - a.anoReferencia;
      if (b.mesReferencia !== a.mesReferencia) return b.mesReferencia - a.mesReferencia;
      return a.socioNome.localeCompare(b.socioNome);
    });

    // Calcular totais
    const totais = {
      totalBase: historicoFormatado.reduce((acc: number, h: any) => acc + h.proLaboreBase, 0),
      totalDescontos: historicoFormatado.reduce((acc: number, h: any) => acc + h.totalDescontos, 0),
      totalLiquido: historicoFormatado.reduce((acc: number, h: any) => acc + h.proLaboreLiquido, 0),
      quantidadeRegistros: historicoFormatado.length,
      quantidadePagos: historicoFormatado.filter((h: any) => h.pago).length,
    };

    return NextResponse.json({
      historico: historicoFormatado,
      totais,
      anoReferencia: anoNum,
    });
  } catch (error) {
    console.error("Erro ao buscar historico de pro-labore:", error);
    return NextResponse.json({ error: "Falha ao buscar historico" }, { status: 500 });
  }
}
