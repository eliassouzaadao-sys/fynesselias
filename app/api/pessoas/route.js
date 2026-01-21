import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Listar pessoas
export async function GET() {
  const pessoas = await prisma.pessoa.findMany();
  return NextResponse.json(pessoas);
}

// POST: Criar pessoa
export async function POST(req) {
  const data = await req.json();
  const pessoa = await prisma.pessoa.create({ data });
  return NextResponse.json(pessoa);
}
