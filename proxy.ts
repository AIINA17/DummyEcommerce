import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    /*
      Hanya proteksi halaman yang benar-benar butuh login.
      Home ("/") dan "/product/*" harus tetap bisa dijelajahi tamu —
      halaman-halaman itu sendiri sudah menangani status guest
      (prompt login saat "Tambah ke Keranjang"), jadi middleware tidak
      boleh mendahului dengan redirect paksa ke /login.
    */
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/order/:path*",
    "/profile/:path*",
  ],
}
