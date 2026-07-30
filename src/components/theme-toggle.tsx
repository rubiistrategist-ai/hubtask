"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Evita o erro de Hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Renderiza um botão fantasma enquanto a página não carrega
    return (
      <Button
        variant="ghost"
        disabled
        className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium text-muted-foreground opacity-50"
      >
        <div className="h-4 w-4" />
        <span>Carregando tema...</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 relative outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-4 w-4"
      >
        {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </motion.div>
      <span className="relative z-10">
        {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
      </span>
    </Button>
  )
}