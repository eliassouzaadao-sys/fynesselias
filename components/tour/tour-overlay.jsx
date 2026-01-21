"use client"

import { useEffect, useState } from "react"
import { useOnboarding } from "@/lib/onboarding-context"
import { ArrowRight, ArrowLeft, X, ChevronRight } from "lucide-react"

const ACCENT_COLOR = "#3B82F6"

export function TourOverlay() {
  const { showTour, tourStep, tourSteps, nextTourStep, prevTourStep, skipTour, completeTour } = useOnboarding()
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [isPositioned, setIsPositioned] = useState(false)

  const currentStepData = tourSteps?.[tourStep]
  const isLastStep = tourStep === (tourSteps?.length || 0) - 1

  useEffect(() => {
    if (!showTour || !currentStepData) return

    setIsPositioned(false)

    const targetEl = document.querySelector(`[data-tour="${currentStepData.target}"]`)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })

      // Wait for scroll to complete before positioning
      const timer = setTimeout(() => {
        const rect = targetEl.getBoundingClientRect()
        setPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
        setIsPositioned(true)
      }, 350)

      return () => clearTimeout(timer)
    }
  }, [showTour, tourStep, currentStepData])

  if (!showTour || !currentStepData || !isPositioned) return null

  const getTooltipStyle = () => {
    const padding = 16
    const tooltipWidth = 280
    const tooltipHeight = 180
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800

    let style = {}

    switch (currentStepData.position) {
      case "right":
        style = {
          top: position.top + position.height / 2,
          left: position.left + position.width + padding,
          transform: "translateY(-50%)",
        }
        break
      case "left":
        style = {
          top: position.top + position.height / 2,
          left: position.left - tooltipWidth - padding,
          transform: "translateY(-50%)",
        }
        break
      case "bottom":
        style = {
          top: position.top + position.height + padding,
          left: position.left + position.width / 2,
          transform: "translateX(-50%)",
        }
        break
      case "top":
        style = {
          top: position.top - padding,
          left: position.left + position.width / 2,
          transform: "translate(-50%, -100%)",
        }
        break
      default:
        style = {
          top: position.top + position.height + padding,
          left: position.left,
        }
    }

    // Ensure tooltip stays within viewport
    if (style.left + tooltipWidth > viewportWidth - padding) {
      style.left = viewportWidth - tooltipWidth - padding
      style.transform = style.transform?.replace("translateX(-50%)", "") || ""
    }
    if (style.left < padding) {
      style.left = padding
      style.transform = style.transform?.replace("translateX(-50%)", "") || ""
    }
    if (style.top + tooltipHeight > viewportHeight - padding) {
      style.top = viewportHeight - tooltipHeight - padding
    }
    if (style.top < padding) {
      style.top = padding
    }

    return style
  }

  const getArrowStyle = () => {
    switch (currentStepData.position) {
      case "right":
        return {
          left: -8,
          top: "50%",
          transform: "translateY(-50%) rotate(180deg)",
        }
      case "left":
        return {
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
        }
      case "bottom":
        return {
          top: -8,
          left: "50%",
          transform: "translateX(-50%) rotate(-90deg)",
        }
      case "top":
        return {
          bottom: -8,
          left: "50%",
          transform: "translateX(-50%) rotate(90deg)",
        }
      default:
        return {}
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[199]"
        style={{ cursor: "not-allowed" }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onScroll={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      />

      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Dark overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={position.left - 4}
                y={position.top - 4}
                width={position.width + 8}
                height={position.height + 8}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.75)" mask="url(#tour-mask)" />
        </svg>

        {/* Highlight border */}
        <div
          className="absolute rounded-lg transition-all duration-300 pointer-events-none"
          style={{
            top: position.top - 4,
            left: position.left - 4,
            width: position.width + 8,
            height: position.height + 8,
            border: `2px solid ${ACCENT_COLOR}`,
            boxShadow: `0 0 0 4px ${ACCENT_COLOR}30`,
          }}
        />

        {/* Tooltip */}
        <div
          className="absolute w-[280px] max-w-[calc(100vw-32px)] pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={getTooltipStyle()}
        >
          <div className="relative bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl p-4">
            {/* Arrow */}
            <div className="absolute" style={getArrowStyle()}>
              <ChevronRight className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-3">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: idx === tourStep ? 20 : 8,
                    backgroundColor: idx <= tourStep ? ACCENT_COLOR : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <h3 className="text-white font-semibold text-sm mb-1">{currentStepData.title}</h3>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">{currentStepData.description}</p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button onClick={skipTour} className="text-xs text-white/40 hover:text-white transition-colors">
                Pular tour
              </button>
              <div className="flex items-center gap-2">
                {tourStep > 0 && (
                  <button
                    onClick={prevTourStep}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={isLastStep ? completeTour : nextTourStep}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs text-white transition-all"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {isLastStep ? "Concluir" : "Próximo"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Skip button in corner */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 pointer-events-auto p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}
