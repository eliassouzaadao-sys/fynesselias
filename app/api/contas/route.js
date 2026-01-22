import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const contas = await prisma.conta.findMany({ orderBy: { vencimento: 'asc' } });
    // Always ensure we return an array, even if database returns null/undefined
    return NextResponse.json(Array.isArray(contas) ? contas : []);
  } catch (error) {
    console.error('Error fetching contas:', error);
    // CRITICAL FIX: Return empty array on error, not error object
    // This prevents "TypeError: data.filter is not a function" in frontend
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const novaConta = await prisma.conta.create({
      data: {
        descricao: data.descricao,
        valor: Number(data.valor),
        vencimento: new Date(data.vencimento),
        pago: data.pago ?? false,
        tipo: data.tipo || 'pagar',
        beneficiario: data.beneficiario || null,
        banco: data.banco || null,
        pessoaId: data.pessoaId ? Number(data.pessoaId) : null,
      },
    });
    return NextResponse.json(novaConta);
  } catch (error) {
    console.error('Error creating conta:', error);
    return NextResponse.json(
      { error: 'Failed to create conta' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const contaAtualizada = await prisma.conta.update({
      where: { id: data.id },
      data: {
        descricao: data.descricao,
        valor: Number(data.valor),
        vencimento: new Date(data.vencimento),
        pago: data.pago,
      },
    });
    return NextResponse.json(contaAtualizada);
  } catch (error) {
    console.error('Error updating conta:', error);
    return NextResponse.json(
      { error: 'Failed to update conta' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await prisma.conta.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting conta:', error);
    return NextResponse.json(
      { error: 'Failed to delete conta' },
      { status: 500 }
    );
  }
}
