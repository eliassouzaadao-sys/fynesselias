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

    // Calcular os gastos de cada sócio
    const sociosComProLabore = await Promise.all(
      socios.map(async (socio) => {
        try {
          const whereContas: any = {
              socioResponsavelId: socio.id,
              pago: true,
              proLaboreProcessado: false,
              userId: user.id,
            };
          if (empresaId) whereContas.empresaId = empresaId;

          const contasPagasMes = await prisma.conta.findMany({
            where: whereContas,
          });

          const contasValidas = contasPagasMes.filter(c => {
            if (c.parentId !== null) return true;
            if (c.parentId === null && c.totalParcelas === null) return true;
            return false;
          });

          const gastosMes = contasValidas.reduce((acc, c) => acc + Number(c.valor), 0);

          if (socio.realizado !== gastosMes) {
            await prisma.centroCusto.update({
              where: { id: socio.id },
              data: { realizado: gastosMes },
            });
          }

          return {
            ...socio,
            proLaboreBase: socio.previsto,
            gastosCartao: gastosMes,
            proLaboreLiquido: socio.previsto - gastosMes,
            ultimosGastos: socio.contasResponsavel,
          };
        } catch (err) {
          console.error(`Erro ao calcular gastos do sócio ${socio.nome}:`, err);
          return {
            ...socio,
            proLaboreBase: socio.previsto,
            gastosCartao: socio.realizado,
            proLaboreLiquido: socio.previsto - socio.realizado,
            ultimosGastos: socio.contasResponsavel,
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
    const { nome, cpf, proLaboreBase } = data;

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

    // Gerar sigla única para o sócio
    const primeiroNome = nome.split(" ")[0].toUpperCase();
    const siglaBase = `SOCIO-${primeiroNome}`;

    let sigla = siglaBase;
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
    const { id, nome, cpf, proLaboreBase } = data;

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

    const socio = await prisma.centroCusto.update({
      where: { id: idNum },
      data: {
        nome,
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
