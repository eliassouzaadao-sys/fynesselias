"use client"

import { createContext, useContext, useState, useEffect } from "react"

const OnboardingContext = createContext({
  showOnboarding: false,
  showTour: false,
  tourStep: 0,
  onboardingData: {},
  setOnboardingData: () => {},
  completeOnboarding: () => {},
  skipOnboarding: () => {},
  startTour: () => {},
  nextTourStep: () => {},
  prevTourStep: () => {},
  skipTour: () => {},
  completeTour: () => {},
})

const TOUR_STEPS = [
  {
    id: "sidebar",
    title: "Menu Principal",
    description: "Navegue por todas as funcionalidades do sistema através deste menu lateral.",
    target: "sidebar",
    position: "right",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Visão geral da saúde financeira da sua empresa com KPIs e gráficos.",
    target: "dashboard-kpis",
    position: "bottom",
  },
  {
    id: "caixa",
    title: "Caixa",
    description: "Controle movimentações financeiras e gerencie suas contas bancárias em um só lugar.",
    target: "menu-caixa",
    position: "right",
  },
  {
    id: "pagar-receber",
    title: "Contas a Pagar e Receber",
    description: "Controle suas obrigações e recebíveis com fornecedores e clientes.",
    target: "menu-pagar",
    position: "right",
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Acesse DRE, Fluxo de Caixa e análise de endividamento.",
    target: "menu-relatorios",
    position: "right",
  },
]

export function OnboardingProvider({ children }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [onboardingData, setOnboardingDataState] = useState({
    source: "",
    bankAccounts: [],
  })

  useEffect(() => {
    localStorage.removeItem("fynness_onboarding_complete")
    localStorage.removeItem("fynness_tour_complete")

    const hasCompletedOnboarding = localStorage.getItem("fynness_onboarding_complete")
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  function setOnboardingData(data) {
    setOnboardingDataState((prev) => ({ ...prev, ...data }))
  }

  function completeOnboarding() {
    localStorage.setItem("fynness_onboarding_complete", "true")
    localStorage.setItem("fynness_onboarding_data", JSON.stringify(onboardingData))
    setShowOnboarding(false)
    // Start tour after onboarding
    const hasCompletedTour = localStorage.getItem("fynness_tour_complete")
    if (!hasCompletedTour) {
      setShowTour(true)
    }
  }

  function skipOnboarding() {
    localStorage.setItem("fynness_onboarding_complete", "true")
    setShowOnboarding(false)
    const hasCompletedTour = localStorage.getItem("fynness_tour_complete")
    if (!hasCompletedTour) {
      setShowTour(true)
    }
  }

  function startTour() {
    setTourStep(0)
    setShowTour(true)
  }

  function nextTourStep() {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep((prev) => prev + 1)
    } else {
      completeTour()
    }
  }

  function prevTourStep() {
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1)
    }
  }

  function skipTour() {
    localStorage.setItem("fynness_tour_complete", "true")
    setShowTour(false)
  }

  function completeTour() {
    localStorage.setItem("fynness_tour_complete", "true")
    setShowTour(false)
  }

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        showTour,
        tourStep,
        tourSteps: TOUR_STEPS,
        onboardingData,
        setOnboardingData,
        completeOnboarding,
        skipOnboarding,
        startTour,
        nextTourStep,
        prevTourStep,
        skipTour,
        completeTour,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}
