import { AppShell } from "@/components/layout/app-shell"
import { OnboardingProvider } from "@/lib/onboarding-context"
import { EmpresaProvider } from "@/lib/empresa-context"
import { OnboardingModal } from "@/components/onboarding/onboarding-modal"

export default function AppLayout({ children }) {
  return (
    <EmpresaProvider>
      <OnboardingProvider>
        <OnboardingModal />
        <AppShell>{children}</AppShell>
      </OnboardingProvider>
    </EmpresaProvider>
  )
}
