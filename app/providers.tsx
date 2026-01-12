"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import Navbar from "./components/Navbar"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      {children}
    </SessionProvider>
  )
}
