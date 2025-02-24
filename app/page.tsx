"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Providers from "./Providers";

// Import your custom API client
import { apiClient } from "@/lib/apiClient";

// Tamir kaydı (Repair) arayüzü
interface Repair {
  id: number;
  status: string;
  // Diğer alanlar (machine, date, priceOffer vs. olabilir)
}

export default function HomePage() {
  const router = useRouter();

  // Token kontrolü
  const [token, setToken] = useState<string | null>(null);

  // 1) Giriş kontrolü
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      // Giriş yoksa login sayfasına yönlendir
      router.push("/login");
    } else {
      // Giriş yapılmış, token state'e atıyoruz
      setToken(storedToken);
    }
  }, [router]);

  // 2) Ekranda göstereceğimiz veriler
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  // Rastgele cümleleri tutacak state
  const [randomMessages, setRandomMessages] = useState<string[]>([]);

  // .env.local => NEXT_PUBLIC_API_URL=https://localhost:7166
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com";

  // Sayfa ilk açıldığında tamir listesi çek
  useEffect(() => {
    if (!token) return; // token yoksa veri çekmeyi deneme
    (async () => {
      setLoading(true);
      await fetchRepairs();
      setLoading(false);
    })();
  }, [token]);

  // Tüm tamir kayıtlarını çeken fonksiyon
  async function fetchRepairs() {
    try {
      // Burada apiClient kullanıyoruz
      const res = await apiClient(`${baseUrl}/api/Repairs`);
      if (!res.ok) {
        console.error("Tamir listesi çekilemedi:", await res.text());
        return;
      }
      const data = await res.json();
      // data => tüm tamir kayıtları
      setRepairs(data);

      // Rastgele cümleleri üret
      const generated = generateRandomMessages(data);
      setRandomMessages(generated);

    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setLoading(false);
    }
  }

  // Rastgele cümleler oluşturma
  function generateRandomMessages(allRepairs: Repair[]): string[] {
    // Örnek: Toplam tamir kaydı sayısı
    const totalCount = allRepairs.length;

    // Kaç tanesi "Gönderildi"
    const deliveredCount = allRepairs.filter(r => r.status === "Gönderildi").length;

    // Kaç tanesi "İşlendi" veya "Tamamlandı"
    const completedCount = allRepairs.filter(
      r => r.status === "İşlendi" || r.status === "Tamamlandı"
    ).length;

    // Rastgele cümle şablonları
    const templates = [
      `Şimdiye dek toplam ${totalCount} adet makine tamir edildi!`,
      `Gönderilen tamir sayısı: ${deliveredCount}. Hizmet kalitesi artıyor!`,
      `Şu ana kadar ${completedCount} tamir başarıyla tamamlandı.`,
      `Toplam ${totalCount} tamir kaydı oluşturuldu. Ekibimiz yoğun çalışıyor!`,
      `Servis ekibimiz, ${completedCount} adet tamiri sorunsuz bitirdi.`,
    ];

    // Burada 2-3 cümle seçip geri döndürelim
    const result: string[] = [];
    const howMany = 3; // Kaç cümle göstereceğiz

    for (let i = 0; i < howMany; i++) {
      const randomIndex = Math.floor(Math.random() * templates.length);
      result.push(templates[randomIndex]);
    }

    return result;
  }

  // İstatistikler:
  // "Taslak", "İşlemde", "İşlendi"/"Tamamlandı", "Gönderildi"
  const inProgressRepairs = repairs.filter(
    (r) => r.status === "Taslak" || r.status === "İşlemde"
  ).length;
  const completedRepairs = repairs.filter(
    (r) => r.status === "İşlendi" || r.status === "Tamamlandı"
  ).length;
  const deliveredRepairs = repairs.filter(
    (r) => r.status === "Gönderildi"
  ).length;

  // Toplam (sadece bu 3 kategoriye girenler)
  const total = inProgressRepairs + completedRepairs + deliveredRepairs;

  // Yüzdeler
  const inProgressPercent = total ? (inProgressRepairs / total) * 100 : 0;
  const completedPercent = total ? (completedRepairs / total) * 100 : 0;
  const deliveredPercent = total ? (deliveredRepairs / total) * 100 : 0;

  // Son 5 tamir
  const recentRepairs = [...repairs]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  if (!token) {
    // Henüz token yoksa (veya router push aşamasındaysak) bir "Yükleniyor" gösterebiliriz
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Giriş kontrol ediliyor...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Çıkış yap fonksiyonu
  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-500 p-6 flex flex-col items-center">
        <div className="w-full max-w-5xl bg-white shadow-md rounded-md p-8">
          {/* Üst kısım: başlık ve Logout butonu */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Ana Sayfa 
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Çıkış Yap
            </button>
          </div>

          <p className="mb-6 text-gray-700">
         
          </p>

          {/* Linkler */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Link
              href="/customers"
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-4 rounded text-center font-semibold transition-colors"
            >
              Müşteriler
            </Link>
            <Link
              href="/machines"
              className="bg-green-100 hover:bg-green-200 text-green-800 p-4 rounded text-center font-semibold transition-colors"
            >
              Makineler
            </Link>
            <Link
              href="/repairs"
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 p-4 rounded text-center font-semibold transition-colors"
            >
              Tamir Listesi
            </Link>
            <Link
              href="/qr"
              className="bg-pink-100 hover:bg-pink-200 text-pink-800 p-4 rounded text-center font-semibold transition-colors"
            >
              QR Kod Oluştur
            </Link>
          </div>

          {/* Rastgele cümleler */}
          <div className="bg-gray-50 p-4 rounded shadow-sm mb-8">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Servis Hakkında Son Durumlar
            </h2>
            {randomMessages.map((msg, idx) => (
              <p key={idx} className="text-gray-700 mb-1">
                • {msg}
              </p>
            ))}
          </div>

          {/* İstatistik Kartları */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded shadow-sm">
              <h2 className="text-lg font-bold text-blue-700">İşlemde (ve Taslak)</h2>
              <p className="text-3xl font-extrabold mt-2">
                {inProgressRepairs}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded shadow-sm">
              <h2 className="text-lg font-bold text-green-700">
                Tamamlanan (veya İşlendi)
              </h2>
              <p className="text-3xl font-extrabold mt-2">
                {completedRepairs}
              </p>
            </div>
            <div className="bg-teal-50 p-4 rounded shadow-sm">
              <h2 className="text-lg font-bold text-teal-700">Gönderilen</h2>
              <p className="text-3xl font-extrabold mt-2">
                {deliveredRepairs}
              </p>
            </div>
          </div>

          {/* Basit Progress Bar */}
          <div className="bg-gray-50 p-4 rounded shadow-sm mb-8">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Tamir Durum Dağılımı
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1/3 text-right pr-2 text-sm text-gray-600">
                  İşlemde/Taslak
                </div>
                <div className="w-2/3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-4"
                    style={{ width: `${inProgressPercent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {inProgressPercent.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-1/3 text-right pr-2 text-sm text-gray-600">
                  İşlendi/Tamamlandı
                </div>
                <div className="w-2/3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="bg-green-400 h-4"
                    style={{ width: `${completedPercent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {completedPercent.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-1/3 text-right pr-2 text-sm text-gray-600">
                  Gönderildi
                </div>
                <div className="w-2/3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-400 h-4"
                    style={{ width: `${deliveredPercent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {deliveredPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Son Tamir Kayıtları */}
          <div className="bg-gray-50 p-4 rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Son Tamir Kayıtları
            </h2>
            {repairs.length === 0 ? (
              <p>Hiç tamir kaydı yok.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="py-2 px-4 text-left text-sm text-gray-600">
                      ID
                    </th>
                    <th className="py-2 px-4 text-left text-sm text-gray-600">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRepairs.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="py-2 px-4">{r.id}</td>
                      <td className="py-2 px-4">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Providers>
  );
}
