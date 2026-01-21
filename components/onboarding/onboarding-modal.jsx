"use client"

import { useOnboarding } from "@/lib/onboarding-context"
import { SourceStep } from "./steps/source-step"

export function OnboardingModal() {
  const { showOnboarding } = useOnboarding()

  if (!showOnboarding) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Progress Bar */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
          <SourceStep />
        </div>
      </div>
    </div>
  )
}
