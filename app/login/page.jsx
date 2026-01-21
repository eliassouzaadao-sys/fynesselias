import { LoginForm } from "./login-form"

export const metadata = {
  title: "Login - Fynness",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fyn-surface">
      <div className="w-full max-w-sm">
        <div className="rounded border border-fyn-border bg-fyn-bg p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-fyn-text">Fynness</h1>
            <p className="mt-1 text-sm text-fyn-text-muted">Gestão Financeira para MEI e EPP</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
