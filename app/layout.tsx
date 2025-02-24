import "./globals.css";
import { Inter } from "next/font/google";

// ÖNEMLİ: BURADA "use client" YOK
// ÇÜNKÜ metadata tanımlayacağız ve layout'un server component olması gerekiyor.

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Repair Service",
  description: "Kaynak Makine Tamir Servisi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-4 shadow">
          <nav className="container mx-auto flex items-center gap-6">
            <a href="/" className="font-bold text-xl hover:text-gray-200">
              DEFA TEKNİK SERVİS
            </a>
       
          </nav>
        </header>

        {/* 
          MantineProvider gibi client-side gerektiren kütüphaneleri,
          alt seviyede "use client" olan bir bileşende sarmalayacağız.
        */}
        <main className="container mx-auto p-6 min-h-screen">
          {/* Burada children'ı, Client Mantine Provider ile sarmalarız */}
          {children}
        </main>
      </body>
    </html>
  );
}
