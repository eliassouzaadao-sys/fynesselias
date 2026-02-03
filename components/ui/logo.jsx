"use client"

export function FynessLogo({ className = "", size = "default", variant = "light" }) {
  const sizes = {
    small: { height: 20, width: 90 },
    default: { height: 28, width: 130 },
    large: { height: 40, width: 180 },
  }

  const { height, width } = sizes[size] || sizes.default

  const textColor = variant === "light" ? "#3B82F6" : "#FFFFFF"
  const accentColor = variant === "light" ? "#1E3A5F" : "#FFFFFF"

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="0"
        y="38"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="42"
        fontWeight="bold"
        fontStyle="italic"
        fill={textColor}
      >
        Fyness
      </text>

      <rect x="148" y="28" width="12" height="12" fill={accentColor} />
      <path d="M160 40 L172 40 L160 28 Z" fill={accentColor} />
    </svg>
  )
}

export function FynessIcon({ className = "", size = 32, variant = "light" }) {
  const accentColor = variant === "light" ? "#1E3A5F" : "#FFFFFF"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="5"
        y="40"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="45"
        fontWeight="bold"
        fontStyle="italic"
        fill={variant === "light" ? "#3B82F6" : "#FFFFFF"}
      >
        F
      </text>

      <rect x="28" y="30" width="10" height="10" fill={accentColor} />
      <path d="M38 40 L48 40 L38 30 Z" fill={accentColor} />
    </svg>
  )
}
