import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";

// GET - Listar todas as empresas do usuário
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresas = await prisma.empresa.findMany({
      where: {
        userId: user.id,
        ativo: true,
      },
      orderBy: { criadoEm: "asc" },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: "Falha ao buscar empresas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova empresa
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Validar campos obrigatórios
    if (!data.nome?.trim()) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.create({
      data: {
        nome: data.nome.trim(),
        cnpj: data.cnpj?.trim() || null,
        nomeFantasia: data.nomeFantasia?.trim() || null,
        endereco: data.endereco?.trim() || null,
        cidade: data.cidade?.trim() || null,
        estado: data.estado?.trim() || null,
        cep: data.cep?.trim() || null,
        telefone: data.telefone?.trim() || null,
        email: data.email?.trim() || null,
        userId: user.id,
      },
    });

    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: "Falha ao criar empresa" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar empresa
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a empresa pertence ao usuário
    const empresaExistente = await prisma.empresa.findFirst({
      where: {
        id: data.id,
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
      where: { id: data.id },
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

// DELETE - Desativar empresa (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    const empresaId = parseInt(id);
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
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

    // Soft delete - desativar a empresa
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
