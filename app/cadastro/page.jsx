import { CadastroForm } from "./cadastro-form"

export const metadata = {
  title: "Cadastro - Fynness",
}

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fyn-surface py-8">
      <div className="w-full max-w-md">
        <div className="rounded border border-fyn-border bg-fyn-bg p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-fyn-text">Criar Conta</h1>
            <p className="mt-1 text-sm text-fyn-text-muted">
              Preencha os dados abaixo para se cadastrar
            </p>
          </div>
          <CadastroForm />
        </div>
      </div>
    </div>
  )
}
