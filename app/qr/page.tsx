"use client";

import { useState } from "react";
// Örneğin apiClient fonksiyonunuzu şu şekilde import edin:
import { apiClient } from "@/lib/apiClient";

export default function QrGeneratorPage() {
  const [text, setText] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // .env.local => NEXT_PUBLIC_API_URL=https://localhost:7166
  // Bu sayede: https://localhost:7166/api/Repairs/qr?text=...
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com";

  async function handleGenerate() {
    if (!text) return;
    setLoading(true);

    try {
      // fetch yerine apiClient kullanıyoruz
      const url = `${baseUrl}/api/Repairs/qr?text=${encodeURIComponent(text)}`;
      const res = await apiClient(url, {
        method: "GET",
      });

      if (!res.ok) {
        console.error("Sunucudan hata döndü:", await res.text());
        return;
      }

      const data = await res.json();
      console.log("Sunucudan gelen JSON:", data);
      // data şunun gibi olmalı: { "qrCode": "data:image/png;base64,iVBOR..." }

      // Eğer sunucu "qrCode" ismini kullanıyorsa:
      setQrCode(data.qrCode);

    } catch (err) {
      console.error("QR kod oluşturulurken hata:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">QR Kod Oluştur</h1>
        <p className="text-gray-700 mb-4 text-center">
          Buraya girilen metinle QR kod oluşturabilirsiniz.
        </p>

        {/* Metin Giriş Alanı */}
        <div className="mb-4">
          <label
            htmlFor="qrText"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Metin / URL
          </label>
          <input
            id="qrText"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Örneğin: www.editlexcel.com"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Oluşturma Butonu */}
        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
          disabled={!text || loading}
        >
          {loading ? "Oluşturuluyor..." : "QR Kod Oluştur"}
        </button>

        {/* QR Kod Görseli ve Bilgiler */}
        {qrCode && !loading && (
          <div className="mt-6 text-center">
            <p className="mb-2 font-semibold">Oluşturulan QR Kod:</p>
            {/* Base64 veriyi <img> olarak göstermek */}
            <img src={qrCode} alt="QR Code" className="mx-auto border p-2" />

            <p className="text-sm text-gray-500 mt-2">
              Aşağıdaki metni taratarak test edebilirsiniz:
            </p>
            <p className="text-xs text-gray-400 mt-1">{text}</p>

            {/* Base64 resmi PNG olarak indirme */}
            <a
              href={qrCode}
              download="qrcode.png"
              className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              QR Kodunu İndir
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
