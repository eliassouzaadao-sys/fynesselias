import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Buscar historico de folha para geracao de holerites
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
    const funcionarioId = searchParams.get('funcionarioId');
    const mes = searchParams.get('mes');

    const anoNum = parseInt(ano);
    const mesNum = mes ? parseInt(mes) : null;

    // Construir filtro para historico existente
    const where: any = {
      userId: user.id,
      anoReferencia: anoNum,
    };
    if (empresaId) where.empresaId = empresaId;
    if (funcionarioId && funcionarioId !== 'todos') where.funcionarioId = parseInt(funcionarioId);
    if (mesNum) where.mesReferencia = mesNum;

    // Buscar historico de folha existente
    const historico = await prisma.historicoFolha.findMany({
      where,
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" },
        { funcionarioNome: "asc" },
      ],
    });

    // Formatar historico existente
    const historicoFormatado: any[] = historico.map((item: any) => ({
      id: item.id,
      mesReferencia: item.mesReferencia,
      anoReferencia: item.anoReferencia,
      funcionarioId: item.funcionarioId,
      funcionarioNome: item.funcionarioNome,
      funcionarioCpf: item.funcionarioCpf,
      salarioBruto: item.salarioBruto,
      inss: item.inss,
      irrf: item.irrf,
      fgts: item.fgts,
      valeTransporte: item.valeTransporte,
      valeRefeicao: item.valeRefeicao,
      planoSaude: item.planoSaude,
      outrosDescontos: item.outrosDescontos,
      salarioLiquido: item.salarioLiquido,
      custoEmpresa: item.custoEmpresa,
      pago: item.pago,
      dataPagamento: item.dataPagamento,
      contaGeradaId: item.contaGeradaId,
      criadoEm: item.criadoEm,
      isTempoReal: false,
    }));

    // Gerar holerites em tempo real para meses sem historico
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // Buscar funcionarios ativos
    const whereFuncionarios: any = {
      userId: user.id,
      status: "ativo",
    };
    if (empresaId) whereFuncionarios.empresaId = empresaId;
    if (funcionarioId && funcionarioId !== 'todos') whereFuncionarios.id = parseInt(funcionarioId);

    const funcionarios = await prisma.funcionario.findMany({
      where: whereFuncionarios,
    });

    // Para cada funcionario, verificar se tem historico do mes/ano selecionado
    const mesesParaGerar = mesNum ? [mesNum] : Array.from({ length: 12 }, (_, i) => i + 1);

    for (const func of funcionarios) {
      for (const mesGerar of mesesParaGerar) {
        // Nao gerar para meses futuros
        if (anoNum > anoAtual || (anoNum === anoAtual && mesGerar > mesAtual)) {
          continue;
        }

        // Verificar se ja tem historico
        const jaTemHistorico = historicoFormatado.some(
          (h: any) => h.funcionarioId === func.id && h.mesReferencia === mesGerar && h.anoReferencia === anoNum
        );

        if (!jaTemHistorico) {
          // Calcular valores do funcionario
          const salarioBruto = func.salarioBruto;
          const inss = func.inss;
          const irrf = func.irrf;
          const fgts = func.fgts;
          const valeTransporte = func.valeTransporte;
          const valeRefeicao = func.valeRefeicao;
          const planoSaude = func.planoSaude;
          const outrosDescontos = 0;

          // Salario liquido = Bruto - INSS - IRRF - VT (desconto do funcionario)
          const descontosTotal = inss + irrf + valeTransporte;
          const salarioLiquido = salarioBruto - descontosTotal;

          // Custo empresa = Bruto + FGTS + VR + Plano Saude + outros beneficios
          const custoEmpresa = salarioBruto + fgts + valeRefeicao + planoSaude + func.outrosBeneficios;

          historicoFormatado.push({
            id: `temp-${func.id}-${mesGerar}-${anoNum}`,
            mesReferencia: mesGerar,
            anoReferencia: anoNum,
            funcionarioId: func.id,
            funcionarioNome: func.nome,
            funcionarioCpf: func.cpf,
            salarioBruto,
            inss,
            irrf,
            fgts,
            valeTransporte,
            valeRefeicao,
            planoSaude,
            outrosDescontos,
            salarioLiquido,
            custoEmpresa,
            pago: false,
            dataPagamento: null,
            contaGeradaId: null,
            criadoEm: null,
            isTempoReal: true,
          });
        }
      }
    }

    // Ordenar por mes/ano decrescente
    historicoFormatado.sort((a: any, b: any) => {
      if (b.anoReferencia !== a.anoReferencia) return b.anoReferencia - a.anoReferencia;
      if (b.mesReferencia !== a.mesReferencia) return b.mesReferencia - a.mesReferencia;
      return a.funcionarioNome.localeCompare(b.funcionarioNome);
    });

    // Calcular totais
    const totais = {
      totalBruto: historicoFormatado.reduce((acc: number, h: any) => acc + h.salarioBruto, 0),
      totalLiquido: historicoFormatado.reduce((acc: number, h: any) => acc + h.salarioLiquido, 0),
      totalCustoEmpresa: historicoFormatado.reduce((acc: number, h: any) => acc + h.custoEmpresa, 0),
      totalInss: historicoFormatado.reduce((acc: number, h: any) => acc + h.inss, 0),
      totalIrrf: historicoFormatado.reduce((acc: number, h: any) => acc + h.irrf, 0),
      totalFgts: historicoFormatado.reduce((acc: number, h: any) => acc + h.fgts, 0),
      quantidadeRegistros: historicoFormatado.length,
      quantidadePagos: historicoFormatado.filter((h: any) => h.pago).length,
    };

    return NextResponse.json({
      historico: historicoFormatado,
      totais,
      anoReferencia: anoNum,
    });
  } catch (error) {
    console.error("Erro ao buscar historico de folha:", error);
    return NextResponse.json({ error: "Falha ao buscar historico" }, { status: 500 });
  }
}
