import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Buscar histórico de pró-labore de um sócio
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await params;
    const socioId = parseInt(id);

    // Buscar o sócio (verificando se pertence ao usuário)
    const whereSocio: any = { id: socioId, userId: user.id };
    if (empresaId) whereSocio.empresaId = empresaId;

    const socio = await prisma.centroCusto.findFirst({
      where: whereSocio,
    });

    if (!socio || !socio.isSocio) {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    // Calcular período do mês atual
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    // 1. Buscar descontos recorrentes (previstos)
    const whereDescontosRecorrentes: any = {
      socioId: socioId,
      userId: user.id,
      ativo: true,
    };
    if (empresaId) whereDescontosRecorrentes.empresaId = empresaId;

    const descontosRecorrentes = await prisma.descontoRecorrente.findMany({
      where: whereDescontosRecorrentes,
    });

    const descontosPrevistos = descontosRecorrentes.reduce((acc: number, d: any) => acc + Number(d.valor), 0);

    // 2. Buscar contas pagas no mês vinculadas a este sócio (descontos reais)
    const whereContas: any = {
      userId: user.id,
      socioResponsavelId: socioId,
      pago: true,
      dataPagamento: {
        gte: primeiroDiaMes,
        lte: ultimoDiaMes,
      },
    };
    if (empresaId) whereContas.empresaId = empresaId;

    const contasPagasMes = await prisma.conta.findMany({
      where: whereContas,
    });

    // Filtrar: excluir contas pai de parcelamento
    const contasValidas = contasPagasMes.filter((c: any) => {
      if (c.parentId !== null) return true;
      if (c.parentId === null && c.totalParcelas === null) return true;
      return false;
    });

    const descontosReais = contasValidas.reduce((acc: number, c: any) => acc + Number(c.valor), 0);
    const totalDescontos = descontosPrevistos + descontosReais;

    // Retornar dados do mês atual
    const faturasPorMes = [{
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      proLaboreBase: socio.previsto,
      descontosPrevistos,
      descontosReais,
      descontoCartao: totalDescontos, // Total para compatibilidade
      proLaboreLiquido: socio.previsto - totalDescontos,
      faturaPaga: false,
      faturaId: null,
      dataVencimento: null,
    }];

    return NextResponse.json({
      socio: {
        id: socio.id,
        nome: socio.nome,
        cpf: socio.cpfSocio,
        sigla: socio.sigla,
        proLaboreBase: socio.previsto,
      },
      historico: faturasPorMes,
      descontosRecorrentes: descontosRecorrentes.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        valor: d.valor,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching pró-labore:", error);
    return NextResponse.json({ error: "Failed to fetch pró-labore" }, { status: 500 });
  }
}

// POST - Zerar os gastos do mês (resetar realizado)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await params;
    const socioId = parseInt(id);
    const data = await request.json();
    const { mes, ano } = data;

    // Buscar o sócio (verificando se pertence ao usuário)
    const whereSocio: any = { id: socioId, userId: user.id };
    if (empresaId) whereSocio.empresaId = empresaId;

    const socio = await prisma.centroCusto.findFirst({
      where: whereSocio,
    });

    if (!socio || !socio.isSocio) {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    // Resetar o realizado (para novo mês)
    await prisma.centroCusto.update({
      where: { id: socioId },
      data: { realizado: 0 },
    });

    return NextResponse.json({ success: true, message: "Gastos zerados para novo período" });
  } catch (error) {
    console.error("❌ Error resetting pró-labore:", error);
    return NextResponse.json({ error: "Failed to reset pró-labore" }, { status: 500 });
  }
}
