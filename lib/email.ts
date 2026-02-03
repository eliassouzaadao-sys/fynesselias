import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Fyness <noreply@fyness.com>",
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinir Senha - Fyness</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background-color: #18181b; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Fyness</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px; color: #18181b; font-size: 20px; font-weight: 600;">
                    Redefinir sua senha
                  </h2>
                  <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">
                    Recebemos uma solicitacao para redefinir a senha da sua conta Fyness.
                  </p>
                  <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">
                    Clique no botao abaixo para criar uma nova senha. Este link expira em 1 hora.
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}"
                           style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 6px;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                    Se voce nao solicitou a redefinicao de senha, ignore este email. Sua senha permanecera inalterada.
                  </p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e4e4e7;">
                  <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.5;">
                    Se o botao nao funcionar, copie e cole o link abaixo no seu navegador:
                    <br>
                    <a href="${resetUrl}" style="color: #18181b; word-break: break-all;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 30px; text-align: center; background-color: #fafafa; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Fyness. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Redefinir sua senha - Fyness",
    html,
  });
}
