"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    await signIn("credentials", {
      username,
      password,
      callbackUrl: "/", // setelah login → HOME
    })
  }

  return (
    <form onSubmit={submit} className="container">
      <h1 className="text-4xl text-red-500 font-bold">
        TAILWIND JALAN
      </h1>
      <h2>Login</h2>

      <input
        placeholder="Username"
        onChange={e => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />

      <button>Login</button>

      {/* 👇 INI BAGIAN BARUNYA */}
      <p className="mt-4 text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-600 underline">
          Register here
        </Link>
      </p>
    </form>
  )
}
