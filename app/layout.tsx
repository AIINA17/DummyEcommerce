import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>

        <div className="navbar">
          <div>Dummy E-Commerce</div>

          <div>
            <a href="/" style={{ marginRight: 15 }}>Products</a>
            <a href="/orders">Orders</a>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}
