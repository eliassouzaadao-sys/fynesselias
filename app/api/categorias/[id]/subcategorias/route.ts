import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Cria nova subcategoria para uma categoria
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const params = await context.params;
    const categoriaId = parseInt(params.id);

    if (isNaN(categoriaId)) {
      return NextResponse.json(
        { error: "ID da categoria inválido" },
        { status: 400 }
      );
    }

    const data = await request.json();

    if (!data.nome?.trim()) {
      return NextResponse.json(
        { error: "Nome da subcategoria é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se categoria existe e pertence ao usuário
    const categoriaWhere: { id: number; userId: number; empresaId?: number } = {
      id: categoriaId,
      userId: user.id
    };
    if (empresaId) categoriaWhere.empresaId = empresaId;

    const categoria = await prisma.categoria.findFirst({
      where: categoriaWhere,
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se subcategoria já existe nessa categoria
    const existente = await prisma.subcategoria.findFirst({
      where: {
        nome: data.nome.trim(),
        categoriaId,
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Subcategoria já existe nesta categoria" },
        { status: 400 }
      );
    }

    const subcategoria = await prisma.subcategoria.create({
      data: {
        nome: data.nome.trim(),
        categoriaId,
      },
    });

    return NextResponse.json(subcategoria, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar subcategoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar subcategoria" },
      { status: 500 }
    );
  }
}
