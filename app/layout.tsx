import "./globals.css"
import Providers from "./providers"

export const metadata = {
  title: "ShopKu - Belanja Online Terpercaya",
  description: "Platform e-commerce terbaik",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
