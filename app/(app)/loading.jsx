import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
