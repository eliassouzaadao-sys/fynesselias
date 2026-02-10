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
    const tipo = searchParams.get("tipo");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const hierarquico = searchParams.get("hierarquico"); // Novo parâmetro

    const where: any = {
      ativo: true,
      userId: user.id,
    };

    if (empresaId) where.empresaId = empresaId;

    if (tipo) {
      where.tipo = tipo;
    }

    const centros = await prisma.centroCusto.findMany({
      where,
      include: {
        subcentros: {
          where: { ativo: true },
          orderBy: { nome: "asc" },
        },
      },
      orderBy: { sigla: "asc" },
    });

    // Se hierarquico=true, retorna estrutura plana com indicação de hierarquia
    if (hierarquico === "true") {
      const centrosHierarquicos: any[] = [];

      // Primeiro, centros sem parent (principais)
      const centrosPrincipais = centros.filter((c: any) => !c.parentId && !c.isSocio);

      for (const centro of centrosPrincipais) {
        // Adiciona o centro principal
        centrosHierarquicos.push({
          ...centro,
          level: 0,
          isParent: centro.subcentros && centro.subcentros.length > 0,
        });

        // Adiciona subcentros (incluindo sócios se for PRO-LABORE)
        if (centro.subcentros && centro.subcentros.length > 0) {
          for (const sub of centro.subcentros) {
            centrosHierarquicos.push({
              ...sub,
              level: 1,
              isParent: false,
              parentNome: centro.nome,
              parentSigla: centro.sigla,
            });
          }
        }
      }

      // Adiciona centros sem parent que são sócios (para o caso de estarem órfãos)
      const sociosOrfaos = centros.filter((c: any) => c.isSocio && !c.parentId);
      for (const socio of sociosOrfaos) {
        // Verifica se já não foi adicionado
        if (!centrosHierarquicos.find((ch: any) => ch.id === socio.id)) {
          centrosHierarquicos.push({
            ...socio,
            level: 1,
            isParent: false,
            parentNome: "Pró-labore",
            parentSigla: "PRO-LABORE",
          });
        }
      }

      return NextResponse.json(centrosHierarquicos);
    }

    // Se há filtro de data, calcular previsto e realizado dinamicamente
    if (dataInicio && dataFim) {
      const dataInicioDate = new Date(dataInicio + "T00:00:00");
      const dataFimDate = new Date(dataFim + "T23:59:59");

      const contasWhere: any = {
        userId: user.id,
        vencimento: {
          gte: dataInicioDate,
          lte: dataFimDate,
        },
        codigoTipo: { not: null },
        OR: [
          { parentId: { not: null } },
          {
            AND: [
              { parentId: null },
              { totalParcelas: null },
            ],
          },
        ],
      };

      if (empresaId) contasWhere.empresaId = empresaId;

      const contas = await prisma.conta.findMany({
        where: contasWhere,
      });

      const centrosComValores = centros.map((centro: any) => {
        // Para centros pai (sem parentId), incluir também contas dos subcentros
        // Subcentros têm sigla no formato "PAI.FILHO", então buscamos todas que começam com a sigla do pai
        const isParent = !centro.parentId;

        const contasDoCentro = contas.filter((c: any) => {
          if (isParent) {
            // Centro pai: incluir contas próprias E dos subcentros (sigla começa com "SIGLA" ou "SIGLA.")
            return c.codigoTipo === centro.sigla || c.codigoTipo?.startsWith(centro.sigla + ".");
          } else {
            // Subcentro: apenas contas próprias
            return c.codigoTipo === centro.sigla;
          }
        });

        const previsto = contasDoCentro.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
        const realizado = contasDoCentro
          .filter((c: any) => c.pago)
          .reduce((sum: number, c: any) => sum + Number(c.valor), 0);

        return { ...centro, previsto, realizado };
      });

      return NextResponse.json(centrosComValores);
    }

    return NextResponse.json(centros);
  } catch (error) {
    console.error("Error fetching centros:", error);
    return NextResponse.json({ error: "Failed to fetch centros" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();
    const { nome, sigla, tipo, parentId } = data;

    if (!nome || !sigla || !tipo) {
      return NextResponse.json(
        { error: "Nome, sigla e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["despesa", "faturamento"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo deve ser 'despesa' ou 'faturamento'" },
        { status: 400 }
      );
    }

    const centro = await prisma.centroCusto.create({
      data: {
        nome,
        sigla: sigla.toUpperCase(),
        tipo,
        parentId: parentId || null,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });

    return NextResponse.json(centro, { status: 201 });
  } catch (error: any) {
    console.error("Error creating centro:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um centro com esta sigla" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create centro" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();
    const { id, nome, sigla } = data;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    if (!nome || !sigla) {
      return NextResponse.json(
        { error: "Nome e sigla são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se pertence ao usuário
    const existingWhere: any = { id: parseInt(id), userId: user.id };
    if (empresaId) existingWhere.empresaId = empresaId;

    const existing = await prisma.centroCusto.findFirst({
      where: existingWhere,
    });

    if (!existing) {
      return NextResponse.json({ error: "Centro não encontrado" }, { status: 404 });
    }

    const centro = await prisma.centroCusto.update({
      where: { id: parseInt(id) },
      data: { nome, sigla: sigla.toUpperCase() },
    });

    return NextResponse.json(centro);
  } catch (error: any) {
    console.error("Error updating centro:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Centro não encontrado" }, { status: 404 });
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um centro com esta sigla" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update centro" }, { status: 500 });
  }
}

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
    const existingWhere: any = { id: parseInt(id), userId: user.id };
    if (empresaId) existingWhere.empresaId = empresaId;

    const existing = await prisma.centroCusto.findFirst({
      where: existingWhere,
    });

    if (!existing) {
      return NextResponse.json({ error: "Centro não encontrado" }, { status: 404 });
    }

    // Check if centro has subcentros
    const subcentrosWhere: any = { parentId: parseInt(id) };
    if (empresaId) subcentrosWhere.empresaId = empresaId;

    const subcentros = await prisma.centroCusto.findMany({
      where: subcentrosWhere,
    });

    if (subcentros.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um centro que possui subcentros" },
        { status: 400 }
      );
    }

    await prisma.centroCusto.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting centro:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Centro não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete centro" }, { status: 500 });
  }
}
