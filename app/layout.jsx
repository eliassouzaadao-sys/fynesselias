import { Inter, JetBrains_Mono } from "next/font/google"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Fynness - Gestão Financeira para MEI e EPP",
  description: "Sistema de gestão financeira profissional para microempreendedores e pequenas empresas",
    generator: 'v0.app'
}

export const viewport = {
  themeColor: "#192433",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
