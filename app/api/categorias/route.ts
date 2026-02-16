import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Lista categorias com subcategorias
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    const where: any = { ativo: true, userId: user.id };
    if (empresaId) where.empresaId = empresaId;
    if (tipo && ["pagar", "receber"].includes(tipo)) {
      where.tipo = tipo;
    }

    const categorias = await prisma.categoria.findMany({
      where,
      include: {
        subcategorias: {
          where: { ativo: true },
          orderBy: { nome: "asc" },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - Cria nova categoria
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: "JSON inválido" },
        { status: 400 }
      );
    }

    if (!data.nome?.trim()) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      );
    }

    if (!data.tipo || !["pagar", "receber"].includes(data.tipo)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "pagar" ou "receber"' },
        { status: 400 }
      );
    }

    // Verificar se já existe para este usuário
    const whereExistente: any = {
      nome: data.nome.trim(),
      tipo: data.tipo,
      userId: user.id,
    };
    if (empresaId) whereExistente.empresaId = empresaId;

    const existente = await prisma.categoria.findFirst({
      where: whereExistente,
    });

    if (existente) {
      return NextResponse.json(
        { error: "Categoria já existe para este tipo" },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: {
        nome: data.nome.trim(),
        tipo: data.tipo,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
      include: {
        subcategorias: true,
      },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
