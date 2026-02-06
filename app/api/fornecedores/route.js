import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// GET: Listar fornecedores/clientes (pessoas)
export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const tipo = searchParams.get('tipo') || 'fornecedor'; // 'fornecedor' ou 'cliente'

    const where = {
      userId: user.id,
      tipo,
    };

    if (empresaId) where.empresaId = empresaId;
    if (status) where.status = status;

    // Busca por nome ou documento
    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { documento: { contains: search } },
      ];
    }

    const fornecedores = await prisma.pessoa.findMany({
      where,
      include: {
        _count: {
          select: { contas: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(Array.isArray(fornecedores) ? fornecedores : []);
  } catch (error) {
    console.error('Error fetching fornecedores:', error);
    return NextResponse.json([]);
  }
}

// POST: Criar fornecedor ou cliente
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const data = await req.json();
    const tipo = data.tipo || 'fornecedor'; // 'fornecedor' ou 'cliente'
    const tipoLabel = tipo === 'cliente' ? 'cliente' : 'fornecedor';

    // Validação
    if (!data.nome || data.nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe com mesmo documento
    if (data.documento) {
      const existing = await prisma.pessoa.findFirst({
        where: {
          userId: user.id,
          empresaId: empresaId || undefined,
          documento: data.documento,
          tipo,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Já existe um ${tipoLabel} com este documento` },
          { status: 400 }
        );
      }
    }

    const pessoa = await prisma.pessoa.create({
      data: {
        ...data,
        tipo,
        status: data.status || 'ativo',
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });

    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Error creating pessoa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar registro' },
      { status: 500 }
    );
  }
}

// PUT: Atualizar fornecedor ou cliente
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

    // Verificar se pertence ao usuário (aceita fornecedor ou cliente)
    const where = { id: data.id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const existing = await prisma.pessoa.findFirst({ where });

    if (!existing) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    const tipoLabel = existing.tipo === 'cliente' ? 'cliente' : 'fornecedor';

    // Verificar documento duplicado
    if (data.documento && data.documento !== existing.documento) {
      const duplicateDoc = await prisma.pessoa.findFirst({
        where: {
          userId: user.id,
          empresaId: empresaId || undefined,
          documento: data.documento,
          tipo: existing.tipo,
          id: { not: data.id },
        },
      });

      if (duplicateDoc) {
        return NextResponse.json(
          { error: `Já existe um ${tipoLabel} com este documento` },
          { status: 400 }
        );
      }
    }

    const { id, ...updateData } = data;
    delete updateData.userId;
    delete updateData.empresaId;
    delete updateData.tipo;

    const pessoa = await prisma.pessoa.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Error updating pessoa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar registro' },
      { status: 500 }
    );
  }
}

// DELETE: Deletar ou inativar fornecedor/cliente
export async function DELETE(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id, hardDelete = false } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const where = { id, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const existing = await prisma.pessoa.findFirst({
      where,
      include: { _count: { select: { contas: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    // Se tem contas vinculadas, apenas inativar
    if (existing._count.contas > 0 && !hardDelete) {
      await prisma.pessoa.update({
        where: { id },
        data: { status: 'inativo' },
      });
      return NextResponse.json({ success: true, inativado: true });
    }

    // Se não tem contas ou forçou exclusão
    await prisma.pessoa.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pessoa:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir registro' },
      { status: 500 }
    );
  }
}
