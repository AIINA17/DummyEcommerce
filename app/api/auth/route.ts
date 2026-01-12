import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return new Response("Invalid data", { status: 400 })
  }

  const exists = await prisma.user.findUnique({
    where: { email },
  })

  if (exists) {
    return new Response("User already exists", { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  return Response.json({ success: true })
}
