// Adicione beneficiario como campo opcional
// Rota de API para contas a pagar/receber (mock, sem banco ainda)

import prisma from '@/lib/prisma';


export async function GET() {
  const contas = await prisma.conta.findMany({ orderBy: { vencimento: 'asc' } });
  return Response.json(contas);
}


export async function POST(request) {
  const data = await request.json();
  const novaConta = await prisma.conta.create({
    data: {
      descricao: data.descricao,
      valor: Number(data.valor),
      vencimento: new Date(data.vencimento),
      pago: data.pago ?? false,
      tipo: data.tipo || "pagar",
      beneficiario: data.beneficiario || null,
      banco: data.banco || null,
      pessoaId: data.pessoaId ? Number(data.pessoaId) : null,
    },
  });
  return Response.json(novaConta);
}

export async function PUT(request) {
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
  return Response.json(contaAtualizada);
}

export async function DELETE(request) {
  const { id } = await request.json();
  await prisma.conta.delete({ where: { id } });
  return Response.json({ ok: true });
}
