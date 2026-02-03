import { EsqueceuSenhaForm } from "./esqueceu-senha-form"

export const metadata = {
  title: "Esqueceu a Senha - Fynness",
}

export default function EsqueceuSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fyn-surface">
      <div className="w-full max-w-sm">
        <div className="rounded border border-fyn-border bg-fyn-bg p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-fyn-text">
              Esqueceu a senha?
            </h1>
            <p className="mt-1 text-sm text-fyn-text-muted">
              Digite seu email para receber um link de recuperacao
            </p>
          </div>
          <EsqueceuSenhaForm />
        </div>
      </div>
    </div>
  )
}
