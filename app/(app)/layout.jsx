import { AppShell } from "@/components/layout/app-shell"
import { CompanyProvider } from "@/lib/company-context"
import { OnboardingProvider } from "@/lib/onboarding-context"
import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { TourOverlay } from "@/components/tour/tour-overlay"

export default function AppLayout({ children }) {
  return (
    <OnboardingProvider>
      <CompanyProvider>
        <OnboardingModal />
        <TourOverlay />
        <AppShell>{children}</AppShell>
      </CompanyProvider>
    </OnboardingProvider>
  )
}
