import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";

const EMPRESA_COOKIE_NAME = "empresaAtiva";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Selecionar empresa como ativa
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const empresaId = parseInt(params.id);

    if (isNaN(empresaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se a empresa pertence ao usuário e está ativa
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: empresaId,
        userId: user.id,
        ativo: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Definir cookie com a empresa ativa
    const cookieStore = await cookies();
    cookieStore.set(EMPRESA_COOKIE_NAME, empresaId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Empresa selecionada",
      empresa,
    });
  } catch (error) {
    console.error("Erro ao selecionar empresa:", error);
    return NextResponse.json(
      { error: "Falha ao selecionar empresa" },
      { status: 500 }
    );
  }
}
