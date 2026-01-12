"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    console.log("REGISTER DATA:", { username, password })

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })

    if (!res.ok) {
      alert("Register gagal")
      return
    }

    await signIn("credentials", {
      username,
      password,
      callbackUrl: "/",
    })
  }

  return (
    <form onSubmit={submit}>
      <h1>Register</h1>

      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button type="submit">Register</button>
    </form>
  )
}
