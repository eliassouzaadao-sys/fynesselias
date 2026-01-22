import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Listar pessoas
export async function GET() {
  try {
    const pessoas = await prisma.pessoa.findMany();
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
    const data = await req.json();
    const pessoa = await prisma.pessoa.create({ data });
    return NextResponse.json(pessoa);
  } catch (error) {
    console.error('Error creating pessoa:', error);
    return NextResponse.json(
      { error: 'Failed to create pessoa' },
      { status: 500 }
    );
  }
}
