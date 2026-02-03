import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Buscar empresa específica
export async function GET(request: NextRequest, context: RouteContext) {
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

    const empresa = await prisma.empresa.findFirst({
      where: {
        id: empresaId,
        userId: user.id,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      { error: "Falha ao buscar empresa" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar empresa específica
export async function PUT(request: NextRequest, context: RouteContext) {
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

    const data = await request.json();

    // Verificar se a empresa pertence ao usuário
    const empresaExistente = await prisma.empresa.findFirst({
      where: {
        id: empresaId,
        userId: user.id,
      },
    });

    if (!empresaExistente) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const empresa = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        nome: data.nome?.trim() || empresaExistente.nome,
        cnpj: data.cnpj !== undefined ? data.cnpj?.trim() || null : empresaExistente.cnpj,
        nomeFantasia: data.nomeFantasia !== undefined ? data.nomeFantasia?.trim() || null : empresaExistente.nomeFantasia,
        endereco: data.endereco !== undefined ? data.endereco?.trim() || null : empresaExistente.endereco,
        cidade: data.cidade !== undefined ? data.cidade?.trim() || null : empresaExistente.cidade,
        estado: data.estado !== undefined ? data.estado?.trim() || null : empresaExistente.estado,
        cep: data.cep !== undefined ? data.cep?.trim() || null : empresaExistente.cep,
        telefone: data.telefone !== undefined ? data.telefone?.trim() || null : empresaExistente.telefone,
        email: data.email !== undefined ? data.email?.trim() || null : empresaExistente.email,
      },
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE - Desativar empresa específica
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Verificar se a empresa pertence ao usuário
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: empresaId,
        userId: user.id,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se é a única empresa ativa do usuário
    const totalEmpresas = await prisma.empresa.count({
      where: {
        userId: user.id,
        ativo: true,
      },
    });

    if (totalEmpresas <= 1) {
      return NextResponse.json(
        { error: "Não é possível desativar a única empresa ativa" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.empresa.update({
      where: { id: empresaId },
      data: { ativo: false },
    });

    return NextResponse.json({ success: true, message: "Empresa desativada" });
  } catch (error) {
    console.error("Erro ao desativar empresa:", error);
    return NextResponse.json(
      { error: "Falha ao desativar empresa" },
      { status: 500 }
    );
  }
}
