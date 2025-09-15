import React from "react"
import { BottomNavigation } from "./BottomNavigation"

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <main className="pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}