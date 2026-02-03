import { Suspense } from "react"
import { RedefinirSenhaForm } from "./redefinir-senha-form"

export const metadata = {
  title: "Redefinir Senha - Fynness",
}

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fyn-surface">
      <div className="w-full max-w-sm">
        <div className="rounded border border-fyn-border bg-fyn-bg p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-fyn-text">
              Redefinir Senha
            </h1>
            <p className="mt-1 text-sm text-fyn-text-muted">
              Digite sua nova senha abaixo
            </p>
          </div>
          <Suspense fallback={<div className="text-center text-sm text-fyn-muted">Carregando...</div>}>
            <RedefinirSenhaForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
