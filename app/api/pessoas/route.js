import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// GET: Listar pessoas do usuário
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const where = { userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const pessoas = await prisma.pessoa.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
    // Always ensure we return an array
    return NextResponse.json(Array.isArray(pessoas) ? pessoas : []);
  } catch (error) {
    console.error('Error fetching pessoas:', error);
    // CRITICAL FIX: Return empty array on error, not error object
    return NextResponse.json([]);
  }
}

// POST: Criar pessoa
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await req.json();
    const pessoa = await prisma.pessoa.create({
      data: {
        ...data,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });
    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Error creating pessoa:', error);
    return NextResponse.json(
      { error: 'Failed to create pessoa' },
      { status: 500 }
    );
  }
}

// PUT: Atualizar pessoa
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await req.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se pertence ao usuário
    const where = { id: data.id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const existing = await prisma.pessoa.findFirst({
      where,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pessoa não encontrada' },
        { status: 404 }
      );
    }

    const { id, ...updateData } = data;
    const pessoa = await prisma.pessoa.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Error updating pessoa:', error);
    return NextResponse.json(
      { error: 'Failed to update pessoa' },
      { status: 500 }
    );
  }
}

// DELETE: Deletar pessoa
export async function DELETE(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se pertence ao usuário
    const where = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const existing = await prisma.pessoa.findFirst({
      where,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pessoa não encontrada' },
        { status: 404 }
      );
    }

    await prisma.pessoa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pessoa:', error);
    return NextResponse.json(
      { error: 'Failed to delete pessoa' },
      { status: 500 }
    );
  }
}
