"use client"

import { createContext, useContext, useState, useEffect } from "react"

const OnboardingContext = createContext({
  showOnboarding: false,
  onboardingData: {},
  setOnboardingData: () => {},
  completeOnboarding: () => {},
  skipOnboarding: () => {},
})

export function OnboardingProvider({ children }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingData, setOnboardingDataState] = useState({
    bankAccounts: [],
  })

  useEffect(() => {
    // Onboarding disabled - users go directly to the app
    localStorage.setItem("fynness_onboarding_complete", "true")
    localStorage.setItem("fynness_tour_complete", "true")
  }, [])

  function setOnboardingData(data) {
    setOnboardingDataState((prev) => ({ ...prev, ...data }))
  }

  function completeOnboarding() {
    localStorage.setItem("fynness_onboarding_complete", "true")
    localStorage.setItem("fynness_onboarding_data", JSON.stringify(onboardingData))
    setShowOnboarding(false)
  }

  function skipOnboarding() {
    localStorage.setItem("fynness_onboarding_complete", "true")
    setShowOnboarding(false)
  }

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        onboardingData,
        setOnboardingData,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}
