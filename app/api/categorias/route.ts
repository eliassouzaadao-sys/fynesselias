import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Lista categorias com subcategorias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // 'pagar' ou 'receber'

    const where: any = { ativo: true };
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
  } catch (error: any) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// POST - Cria nova categoria
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

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

    // Verificar se já existe
    const existente = await prisma.categoria.findFirst({
      where: {
        nome: data.nome.trim(),
        tipo: data.tipo,
      },
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
