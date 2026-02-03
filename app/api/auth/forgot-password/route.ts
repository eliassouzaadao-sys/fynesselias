import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Retornar sucesso mesmo se usuário não existir (segurança)
    if (!user) {
      return NextResponse.json({
        message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
      });
    }

    // Deletar tokens antigos do usuário
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Criar novo token com expiração de 1 hora
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Enviar email
    const emailResult = await sendPasswordResetEmail(user.email, token);

    if (!emailResult.success) {
      console.error("Erro ao enviar email de reset:", emailResult.error);
      // Mesmo com erro, retornar sucesso por segurança
    }

    return NextResponse.json({
      message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
    });
  } catch (error) {
    console.error("Erro ao processar forgot-password:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
