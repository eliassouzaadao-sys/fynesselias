import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Listar descontos recorrentes de um sócio
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const socioId = parseInt(id);

    if (isNaN(socioId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se o sócio pertence ao usuário
    const whereSocio: any = {
      id: socioId,
      userId: user.id,
      isSocio: true,
    };
    if (empresaId) whereSocio.empresaId = empresaId;

    const socio = await prisma.centroCusto.findFirst({ where: whereSocio });
    if (!socio) {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    // Buscar descontos recorrentes
    const whereDescontos: any = {
      socioId,
      userId: user.id,
    };
    if (empresaId) whereDescontos.empresaId = empresaId;

    const descontos = await prisma.descontoRecorrente.findMany({
      where: whereDescontos,
      orderBy: { criadoEm: "asc" },
    });

    const totalPrevistos = descontos
      .filter((d) => d.ativo)
      .reduce((acc, d) => acc + d.valor, 0);

    return NextResponse.json({
      descontos,
      totalPrevistos,
    });
  } catch (error: any) {
    console.error("Erro ao listar descontos recorrentes:", error);
    return NextResponse.json(
      { error: "Falha ao listar descontos recorrentes" },
      { status: 500 }
    );
  }
}

// POST - Criar novo desconto recorrente
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const socioId = parseInt(id);

    if (isNaN(socioId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se o sócio pertence ao usuário
    const whereSocio: any = {
      id: socioId,
      userId: user.id,
      isSocio: true,
    };
    if (empresaId) whereSocio.empresaId = empresaId;

    const socio = await prisma.centroCusto.findFirst({ where: whereSocio });
    if (!socio) {
      return NextResponse.json({ error: "Sócio não encontrado" }, { status: 404 });
    }

    const data = await request.json();

    // Validações
    if (!data.nome || !data.nome.trim()) {
      return NextResponse.json(
        { error: "Nome do desconto é obrigatório" },
        { status: 400 }
      );
    }

    if (!data.valor || Number(data.valor) <= 0) {
      return NextResponse.json(
        { error: "Valor do desconto deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Criar desconto recorrente
    const desconto = await prisma.descontoRecorrente.create({
      data: {
        nome: data.nome.trim(),
        valor: Number(data.valor),
        ativo: data.ativo !== false,
        socioId,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });

    return NextResponse.json(desconto);
  } catch (error: any) {
    console.error("Erro ao criar desconto recorrente:", error);
    return NextResponse.json(
      { error: "Falha ao criar desconto recorrente" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar desconto recorrente
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const socioId = parseInt(id);

    if (isNaN(socioId)) {
      return NextResponse.json({ error: "ID do sócio inválido" }, { status: 400 });
    }

    const data = await request.json();

    if (!data.descontoId) {
      return NextResponse.json(
        { error: "ID do desconto é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o desconto pertence ao sócio/usuário
    const whereDesconto: any = {
      id: data.descontoId,
      socioId,
      userId: user.id,
    };
    if (empresaId) whereDesconto.empresaId = empresaId;

    const descontoExistente = await prisma.descontoRecorrente.findFirst({
      where: whereDesconto,
    });

    if (!descontoExistente) {
      return NextResponse.json(
        { error: "Desconto não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.valor !== undefined) updateData.valor = Number(data.valor);
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const descontoAtualizado = await prisma.descontoRecorrente.update({
      where: { id: data.descontoId },
      data: updateData,
    });

    return NextResponse.json(descontoAtualizado);
  } catch (error: any) {
    console.error("Erro ao atualizar desconto recorrente:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar desconto recorrente" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir desconto recorrente
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const socioId = parseInt(id);

    if (isNaN(socioId)) {
      return NextResponse.json({ error: "ID do sócio inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const descontoId = searchParams.get("descontoId");

    if (!descontoId) {
      return NextResponse.json(
        { error: "ID do desconto é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o desconto pertence ao sócio/usuário
    const whereDesconto: any = {
      id: parseInt(descontoId),
      socioId,
      userId: user.id,
    };
    if (empresaId) whereDesconto.empresaId = empresaId;

    const desconto = await prisma.descontoRecorrente.findFirst({
      where: whereDesconto,
    });

    if (!desconto) {
      return NextResponse.json(
        { error: "Desconto não encontrado" },
        { status: 404 }
      );
    }

    await prisma.descontoRecorrente.delete({
      where: { id: parseInt(descontoId) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir desconto recorrente:", error);
    return NextResponse.json(
      { error: "Falha ao excluir desconto recorrente" },
      { status: 500 }
    );
  }
}
