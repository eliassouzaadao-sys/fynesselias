/**
 * API Routes for Bancos
 * GET /api/bancos - List all banks
 * POST /api/bancos - Create new bank
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET - List all active banks
 */
export async function GET() {
  try {
    const bancos = await prisma.banco.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(bancos);
  } catch (error) {
    console.error('Error fetching bancos:', error);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST - Create new bank
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.nome || !data.nome.trim()) {
      return NextResponse.json(
        { error: 'Nome do banco é obrigatório' },
        { status: 400 }
      );
    }

    // Check if bank already exists
    const existingBanco = await prisma.banco.findUnique({
      where: { nome: data.nome },
    });

    if (existingBanco) {
      return NextResponse.json(
        { error: 'Banco já existe' },
        { status: 409 }
      );
    }

    const novoBanco = await prisma.banco.create({
      data: {
        nome: data.nome,
        codigo: data.codigo || null,
      },
    });

    return NextResponse.json(novoBanco, { status: 201 });
  } catch (error) {
    console.error('Error creating banco:', error);
    return NextResponse.json(
      { error: 'Erro ao criar banco' },
      { status: 500 }
    );
  }
}
