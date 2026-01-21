"use client"

import { useState } from "react"
import { useOnboarding } from "@/lib/onboarding-context"
import { Users, GraduationCap, Building2, ArrowRight, Check, HelpCircle, Sparkles } from "lucide-react"

const ACCENT_COLOR = "#3B82F6"
const ACCENT_HOVER = "#2563EB"

function YoutubeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={active ? "#FF0000" : "currentColor"}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function InstagramIcon({ active }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <defs>
          <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFDC80" />
            <stop offset="25%" stopColor="#F77737" />
            <stop offset="50%" stopColor="#E1306C" />
            <stop offset="75%" stopColor="#C13584" />
            <stop offset="100%" stopColor="#833AB4" />
          </linearGradient>
        </defs>
        <path
          fill="url(#instagram-gradient)"
          d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function GoogleIcon({ active }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const sources = [
  { id: "0-ao-credito", label: "Programa 0 ao Crédito", icon: GraduationCap, highlight: true },
  { id: "youtube", label: "YouTube", CustomIcon: YoutubeIcon },
  { id: "instagram", label: "Instagram", CustomIcon: InstagramIcon },
  { id: "indicacao", label: "Indicação de amigo", icon: Users },
  { id: "google", label: "Pesquisa no Google", CustomIcon: GoogleIcon },
  { id: "contador", label: "Meu contador indicou", icon: Building2 },
  { id: "outro", label: "Outro", icon: HelpCircle },
]

export function SourceStep() {
  const { onboardingData, setOnboardingData, completeOnboarding, skipOnboarding } = useOnboarding()
  const [selected, setSelected] = useState(onboardingData.source || "")

  function handleSelect(sourceId) {
    setSelected(sourceId)
  }

  function handleContinue() {
    if (!selected) return
    setOnboardingData({ source: selected })
    completeOnboarding()
  }

  const highlightedSource = sources.find((s) => s.highlight)
  const otherSources = sources.filter((s) => !s.highlight)

  return (
    <div className="p-5">
      {/* Header */}
      <div className="text-center mb-5">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Bem-vindo ao Fynness!</h2>
        <p className="text-xs text-white/60">Conte para nós como você nos conheceu</p>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-5">
        {/* Highlighted option - full width */}
        {highlightedSource && (
          <button
            onClick={() => handleSelect(highlightedSource.id)}
            className="relative w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
            style={{
              backgroundColor: selected === highlightedSource.id ? `${ACCENT_COLOR}30` : "rgba(255,255,255,0.1)",
              border: `2px solid ${selected === highlightedSource.id ? ACCENT_COLOR : "rgba(255,255,255,0.2)"}`,
            }}
          >
            <span
              className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-medium text-white rounded"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              Recomendado
            </span>
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                backgroundColor: selected === highlightedSource.id ? ACCENT_COLOR : "rgba(255,255,255,0.1)",
                color: selected === highlightedSource.id ? "white" : "rgba(255,255,255,0.7)",
              }}
            >
              <highlightedSource.icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-white text-sm flex-1">{highlightedSource.label}</span>
            {selected === highlightedSource.id && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        )}

        {/* Grid 2x3 for other options */}
        <div className="grid grid-cols-2 gap-2">
          {otherSources.map((source) => {
            const isSelected = selected === source.id
            const IconComponent = source.icon
            const CustomIcon = source.CustomIcon

            return (
              <button
                key={source.id}
                onClick={() => handleSelect(source.id)}
                className="flex items-center gap-2 p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isSelected ? `${ACCENT_COLOR}30` : "rgba(255,255,255,0.1)",
                  border: `2px solid ${isSelected ? ACCENT_COLOR : "rgba(255,255,255,0.2)"}`,
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: isSelected && !CustomIcon ? ACCENT_COLOR : "rgba(255,255,255,0.1)",
                    color: isSelected && !CustomIcon ? "white" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {CustomIcon ? <CustomIcon active={isSelected} /> : <IconComponent className="w-4 h-4" />}
                </div>
                <span className={`font-medium flex-1 text-xs ${isSelected ? "text-white" : "text-white/80"}`}>
                  {source.label}
                </span>
                {isSelected && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ACCENT_COLOR }}
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <button onClick={skipOnboarding} className="text-xs text-white/40 hover:text-white transition-colors">
          Pular
        </button>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all text-white"
          style={{
            backgroundColor: selected ? ACCENT_COLOR : "rgba(255,255,255,0.1)",
            color: selected ? "white" : "rgba(255,255,255,0.4)",
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          Começar
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
