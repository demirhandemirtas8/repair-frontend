"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// YENİ: apiClient import'u (değiştirmeden ekliyoruz)
import { apiClient } from "@/lib/apiClient";

interface RepairDetail {
  id: number;
  repairDate: string;
  issueDescription: string;
  status: string;
  priceOffer: number;
  machine: {
    model: string;
    serialNumber: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
  operations: {
    id: number;
    name: string;
    description?: string;
    price: number;
    currency: string;
  }[];
  spareParts: {
    id: number;
    partName: string;
    price: number;
    currency: string;
  }[];
}

export default function RepairReportPage() {
  const router = useRouter();
  const rawId = useParams().id; 
  const repairId = (Array.isArray(rawId) ? rawId[0] : rawId) as string;

  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com";

  useEffect(() => {
    if (!repairId) return;
    fetchRepair(repairId);
  }, [repairId]);

  async function fetchRepair(id: string) {
    try {
      // fetch(...) satırını apiClient(...) şeklinde değiştirdik
      const res = await apiClient(`${apiUrl}/api/Repairs/${id}`, { method: "GET" });
      if (!res.ok) {
        console.error("Rapor verisi alınamadı:", await res.text());
        router.push("/repairs"); // hata halinde listeye dön
        return;
      }
      const data = await res.json();
      setRepair(data);
      setLoading(false);
    } catch (error) {
      console.error("Rapor verisi çekilemedi:", error);
      router.push("/repairs");
    }
  }

  // Yazdırma fonksiyonu
  function handlePrint() {
    window.print();
  }

  if (loading) {
    return <div className="min-h-screen p-6">Yükleniyor...</div>;
  }

  if (!repair) {
    return <div className="min-h-screen p-6">Rapor bulunamadı.</div>;
  }

  // Operasyonlar ve yedek parçaların toplam fiyatını hesapla
  const totalOperations = repair.operations.reduce((acc, op) => acc + op.price, 0);
  const totalSpareParts = repair.spareParts.reduce((acc, sp) => acc + sp.price, 0);
  const totalPrice = totalOperations + totalSpareParts;

  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow-400 to-red-500 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-md p-6">
        <h1 className="text-2xl font-bold mb-4">Tamir Raporu #{repair.id}</h1>

        {/* Müşteri & Makine Bilgisi */}
        <div className="space-y-2 mb-4">
          <p>
            <strong>Müşteri:</strong> {repair.machine.customer.name}
          </p>
          <p>
            <strong>Makine Modeli:</strong> {repair.machine.model} 
            {" "}({repair.machine.serialNumber})
          </p>
          <p>
            <strong>Durum:</strong> {repair.status}
          </p>
          <p>
            <strong>Fiyat Teklifi (Kayıtlı):</strong> {repair.priceOffer} 
          </p>
          <p>
            <strong>Arıza Açıklaması:</strong> {repair.issueDescription}
          </p>
          <p>
            <strong>Tarih:</strong> {new Date(repair.repairDate).toLocaleString("tr-TR")}
          </p>
        </div>

        {/* Operasyonlar Tablosu */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">İşlemler</h2>
          {repair.operations.length === 0 ? (
            <p>Herhangi bir işlem eklenmemiş.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Adı</th>
                  <th className="py-2 px-4 text-left">Açıklama</th>
                  <th className="py-2 px-4 text-left">Fiyat</th>
                  <th className="py-2 px-4 text-left">Kur</th>
                </tr>
              </thead>
              <tbody>
                {repair.operations.map((op, idx) => (
                  <tr
                    key={op.id}
                    className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-2 px-4">{op.name}</td>
                    <td className="py-2 px-4">{op.description}</td>
                    <td className="py-2 px-4">{op.price}</td>
                    <td className="py-2 px-4">{op.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Yedek Parçalar Tablosu */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Yedek Parçalar</h2>
          {repair.spareParts.length === 0 ? (
            <p>Herhangi bir yedek parça eklenmemiş.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Parça Adı</th>
                  <th className="py-2 px-4 text-left">Fiyat</th>
                  <th className="py-2 px-4 text-left">Kur</th>
                </tr>
              </thead>
              <tbody>
                {repair.spareParts.map((sp, idx) => (
                  <tr
                    key={sp.id}
                    className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-2 px-4">{sp.partName}</td>
                    <td className="py-2 px-4">{sp.price}</td>
                    <td className="py-2 px-4">{sp.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Toplam Fiyat */}
        <div className="p-4 bg-gray-100 rounded mb-6">
          <p className="text-lg font-semibold">
            Toplam Tutar (İşlemler + Parçalar): {totalPrice} TRY
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Yazdır
          </button>
          {/* PDF oluşturma isterseniz: 
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                PDF İndir
              </button> 
          */}
          <button
            onClick={() => router.push("/repairs")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Listeye Dön
          </button>
        </div>
      </div>
    </div>
  );
}
