import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Lista todos os sócios do usuário
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    // Buscar o centro de custo pai PRO-LABORE da empresa
    const whereCentroPai: any = { sigla: "PRO-LABORE", userId: user.id };
    if (empresaId) whereCentroPai.empresaId = empresaId;

    let centroPai = await prisma.centroCusto.findFirst({
      where: whereCentroPai,
    });

    if (!centroPai) {
      // Criar novo centro PRO-LABORE para esta empresa
      centroPai = await prisma.centroCusto.create({
        data: {
          nome: "Pró-labore",
          sigla: "PRO-LABORE",
          tipo: "despesa",
          ativo: true,
          userId: user.id,
          empresaId: empresaId || undefined,
        },
      });
    }

    // Buscar todos os sócios do usuário
    const whereSocios: any = {
      isSocio: true,
      ativo: true,
      userId: user.id,
    };
    if (empresaId) whereSocios.empresaId = empresaId;

    const socios = await prisma.centroCusto.findMany({
      where: whereSocios,
      include: {
        contasResponsavel: {
          where: {
            pago: true,
            proLaboreProcessado: false,
            status: { not: "cancelado" }, // Excluir contas canceladas
          },
          select: {
            id: true,
            descricao: true,
            valor: true,
            dataPagamento: true,
          },
          orderBy: { dataPagamento: "desc" },
          take: 10,
        },
      },
      orderBy: { nome: "asc" },
    });

    console.log(`📊 Sócios encontrados: ${socios.length}`);

    // Calcular os gastos de cada sócio MÊS A MÊS
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const sociosComProLabore = await Promise.all(
      socios.map(async (socio: any) => {
        try {
          // 1. Buscar descontos recorrentes ativos (previstos fixos mensais)
          const whereDescontosRecorrentes: any = {
            socioId: socio.id,
            userId: user.id,
            ativo: true,
          };
          if (empresaId) whereDescontosRecorrentes.empresaId = empresaId;

          const descontosRecorrentes = await prisma.descontoRecorrente.findMany({
            where: whereDescontosRecorrentes,
          });

          // Soma dos descontos recorrentes (fixos mensais)
          const descontosRecorrentesTotal = descontosRecorrentes.reduce(
            (acc: number, d: any) => acc + Number(d.valor), 0
          );

          // 2. Buscar contas pendentes do sócio com vencimento no mês atual (previstos variáveis)
          const whereContasPendentes: any = {
            userId: user.id,
            socioResponsavelId: socio.id,
            pago: false,
            status: { not: "cancelado" },
            vencimento: {
              gte: inicioMes,
              lte: fimMes,
            },
          };
          if (empresaId) whereContasPendentes.empresaId = empresaId;

          const contasPendentesMes = await prisma.conta.findMany({
            where: whereContasPendentes,
            select: { id: true, valor: true, parentId: true, totalParcelas: true },
          });

          // Filtrar: excluir contas pai de parcelamento (só contar as parcelas)
          const contasValidasPendentes = contasPendentesMes.filter((c: any) => {
            if (c.parentId !== null) return true;
            if (c.parentId === null && c.totalParcelas === null) return true;
            return false;
          });

          const descontosVariaveisMes = contasValidasPendentes.reduce(
            (acc: number, c: any) => acc + Number(c.valor), 0
          );

          // Total de descontos previstos = recorrentes + variáveis do mês
          const descontosPrevistos = descontosRecorrentesTotal + descontosVariaveisMes;

          // 3. Buscar contas pagas do sócio que ainda não foram processadas (descontos reais)
          const whereContasPagas: any = {
            userId: user.id,
            socioResponsavelId: socio.id,
            pago: true,
            proLaboreProcessado: false,
            status: { not: "cancelado" },
          };
          if (empresaId) whereContasPagas.empresaId = empresaId;

          const contasPagas = await prisma.conta.findMany({
            where: whereContasPagas,
            select: { id: true, valor: true, parentId: true, totalParcelas: true },
          });

          // Filtrar: excluir contas pai de parcelamento
          const contasValidasPagas = contasPagas.filter((c: any) => {
            if (c.parentId !== null) return true;
            if (c.parentId === null && c.totalParcelas === null) return true;
            return false;
          });

          const descontosReaisContas = contasValidasPagas.reduce(
            (acc: number, c: any) => acc + Number(c.valor), 0
          );

          // 4. Adicionar descontos do fluxo de caixa (campo descontoReal do banco)
          // O fluxo de caixa atualiza este campo quando lançamentos são feitos diretamente
          const descontosReaisFluxo = socio.descontoReal || 0;

          // Total de descontos reais = contas pagas + lançamentos do fluxo de caixa
          const descontosReais = descontosReaisContas + descontosReaisFluxo;

          // Total de descontos = previstos + reais
          const totalDescontos = descontosPrevistos + descontosReais;

          return {
            ...socio,
            proLaboreBase: socio.previsto,
            descontosPrevistos,
            descontosReais,
            gastosCartao: totalDescontos, // Total para manter compatibilidade
            proLaboreLiquido: socio.previsto - totalDescontos,
            ultimosGastos: socio.contasResponsavel,
            descontosRecorrentes,
          };
        } catch (err) {
          console.error(`Erro ao calcular gastos do sócio ${socio.nome}:`, err);
          return {
            ...socio,
            proLaboreBase: socio.previsto,
            descontosPrevistos: 0,
            descontosReais: 0,
            gastosCartao: 0,
            proLaboreLiquido: socio.previsto,
            ultimosGastos: socio.contasResponsavel,
            descontosRecorrentes: [],
          };
        }
      })
    );

    return NextResponse.json(sociosComProLabore);
  } catch (error) {
    console.error("Error fetching sócios:", error);
    return NextResponse.json({ error: "Failed to fetch sócios" }, { status: 500 });
  }
}

// POST - Criar novo sócio
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();
    const { nome, cpf, proLaboreBase, sigla: siglaInput } = data;

    if (!nome || !cpf || !proLaboreBase) {
      return NextResponse.json(
        { error: "Nome, CPF e pró-labore base são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar/criar centro de custo pai PRO-LABORE da empresa
    const whereCentroPai: any = { sigla: "PRO-LABORE", userId: user.id };
    if (empresaId) whereCentroPai.empresaId = empresaId;

    let centroPai = await prisma.centroCusto.findFirst({
      where: whereCentroPai,
    });

    if (!centroPai) {
      // Criar novo centro PRO-LABORE para esta empresa
      centroPai = await prisma.centroCusto.create({
        data: {
          nome: "Pró-labore",
          sigla: "PRO-LABORE",
          tipo: "despesa",
          ativo: true,
          userId: user.id,
          empresaId: empresaId || undefined,
        },
      });
    }

    // Usar sigla fornecida ou gerar uma automática
    let sigla: string;

    if (siglaInput && siglaInput.trim()) {
      // Usar a sigla fornecida pelo usuário
      sigla = siglaInput.trim().toUpperCase();

      // Verificar se já existe
      const buildWhereSigla = (s: string) => {
        const w: any = { sigla: s, userId: user.id };
        if (empresaId) w.empresaId = empresaId;
        return w;
      };

      if (await prisma.centroCusto.findFirst({ where: buildWhereSigla(sigla) })) {
        return NextResponse.json(
          { error: `Já existe um registro com a sigla "${sigla}"` },
          { status: 400 }
        );
      }
    } else {
      // Gerar sigla automática baseada no nome
      const primeiroNome = nome.split(" ")[0].toUpperCase();
      const siglaBase = `PL-${primeiroNome}`;

      sigla = siglaBase;
      let contador = 1;
      const buildWhereSigla = (s: string) => {
        const w: any = { sigla: s, userId: user.id };
        if (empresaId) w.empresaId = empresaId;
        return w;
      };
      while (await prisma.centroCusto.findFirst({ where: buildWhereSigla(sigla) })) {
        sigla = `${siglaBase}-${contador}`;
        contador++;
      }
    }

    const socio = await prisma.centroCusto.create({
      data: {
        nome,
        sigla,
        tipo: "despesa",
        ativo: true,
        isSocio: true,
        cpfSocio: cpf,
        previsto: typeof proLaboreBase === 'number' ? proLaboreBase : parseFloat(proLaboreBase),
        realizado: 0,
        parentId: centroPai.id,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });

    return NextResponse.json(socio, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sócio:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um sócio com este CPF ou sigla" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create sócio" }, { status: 500 });
  }
}

// PUT - Atualizar sócio
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();
    const { id, nome, cpf, proLaboreBase, sigla: siglaInput } = data;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const idNum = typeof id === 'number' ? id : parseInt(id);

    // Verificar se pertence ao usuário
    const whereExisting: any = { id: idNum, userId: user.id };
    if (empresaId) whereExisting.empresaId = empresaId;

    const existing = await prisma.centroCusto.findFirst({
      where: whereExisting,
    });

    if (!existing) {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    // Se a sigla foi fornecida e é diferente da atual, verificar se já existe
    let siglaToUpdate = undefined;
    if (siglaInput && siglaInput.trim()) {
      const novaSigla = siglaInput.trim().toUpperCase();

      if (novaSigla !== existing.sigla) {
        // Verificar se já existe outra com esta sigla
        const whereSigla: any = {
          sigla: novaSigla,
          userId: user.id,
          id: { not: idNum },
        };
        if (empresaId) whereSigla.empresaId = empresaId;

        const siglaExistente = await prisma.centroCusto.findFirst({
          where: whereSigla,
        });

        if (siglaExistente) {
          return NextResponse.json(
            { error: `Já existe um registro com a sigla "${novaSigla}"` },
            { status: 400 }
          );
        }

        siglaToUpdate = novaSigla;
      }
    }

    const socio = await prisma.centroCusto.update({
      where: { id: idNum },
      data: {
        nome,
        sigla: siglaToUpdate,
        cpfSocio: cpf,
        previsto: proLaboreBase ? (typeof proLaboreBase === 'number' ? proLaboreBase : parseFloat(proLaboreBase)) : undefined,
      },
    });

    return NextResponse.json(socio);
  } catch (error: any) {
    console.error("Error updating sócio:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update sócio" }, { status: 500 });
  }
}

// DELETE - Desativar sócio
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se pertence ao usuário
    const whereDelete: any = { id: parseInt(id), userId: user.id };
    if (empresaId) whereDelete.empresaId = empresaId;

    const existing = await prisma.centroCusto.findFirst({
      where: whereDelete,
    });

    if (!existing) {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    await prisma.centroCusto.update({
      where: { id: parseInt(id) },
      data: { ativo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting sócio:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete sócio" }, { status: 500 });
  }
}
