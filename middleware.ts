import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    /*
      Match SEMUA halaman,
      KECUALI:
      - /login
      - /register
      - /api (biar API tetap bisa diakses)
      - /_next (asset Next.js)
      - /favicon.ico
    */
    "/((?!login|register|api|_next|favicon.ico).*)",
  ],
}
