"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Import your apiClient helper
import { apiClient } from "@/lib/apiClient";

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com/api";

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      // Using apiClient instead of fetch
      const res = await apiClient(`${apiUrl}/Repairs`);
      if (!res.ok) {
        console.error("Tamir kayıtları çekilemedi:", await res.text());
        return;
      }
      const data = await res.json();
      setRepairs(data);
      setLoading(false);
    } catch (error) {
      console.error("Tamir kayıtları çekilemedi:", error);
    }
  };

  // Sil Butonu => DELETE /api/Repairs/{id}
  const deleteRepair = async (id: number) => {
    if (!confirm("Bu tamiri silmek istediğinize emin misiniz?")) return;
    try {
      // Using apiClient
      const res = await apiClient(`${apiUrl}/Repairs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Silme hatası:", await res.text());
        return;
      }
      // Başarılı => listemizi güncelle
      fetchRepairs();
    } catch (error) {
      console.error("Silme isteği başarısız:", error);
    }
  };

  // Durum ComboBox => PUT /api/Repairs/{id} (sadece status alanını güncelle)
  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const body = { status: newStatus };
      // Using apiClient
      const res = await apiClient(`${apiUrl}/Repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Durum güncelleme hatası:", await res.text());
        return;
      }
      // Güncelleme sonrası listeyi tekrar çek
      fetchRepairs();
    } catch (error) {
      console.error("Durum güncellenemedi:", error);
    }
  };

  function truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tamir Listesi</h1>
          <Link href="/repairs/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Yeni Tamir Oluştur
            </button>
          </Link>
        </div>

        {loading ? (
          <p>Yükleniyor...</p>
        ) : repairs.length === 0 ? (
          <p>Hiç tamir kaydı bulunamadı.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Tarih</th>
                <th className="py-2 px-4 text-left">Durum</th>
                <th className="py-2 px-4 text-left">Açıklama</th>
                <th className="py-2 px-4 text-left">Makine</th>
                <th className="py-2 px-4 text-left">Müşteri</th>
                <th className="py-2 px-4 text-left">Teklif</th>
                <th className="py-2 px-4 text-left">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((repair, index) => (
                <tr
                  key={repair.id}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100`}
                >
                  <td className="py-2 px-4">{repair.id}</td>
                  <td className="py-2 px-4">
                    {new Date(repair.repairDate).toLocaleDateString("tr-TR")}
                  </td>
                  {/* Durum ComboBox */}
                  <td className="py-2 px-4">
                    <select
                      className="border rounded px-2 py-1"
                      value={repair.status}
                      onChange={(e) => updateStatus(repair.id, e.target.value)}
                    >
                      <option value="Taslak">Taslak</option>
                      <option value="İşlendi">İşlendi</option>
                      <option value="Gönderildi">Gönderildi</option>
                    </select>
                  </td>
                  <td className="py-2 px-4">
                    {truncateText(repair.issueDescription, 5)}
                  </td>
                  <td className="py-2 px-4">{repair.machine?.model}</td>
                  <td className="py-2 px-4">{repair.machine?.customer?.name}</td>
                  <td className="py-2 px-4">{repair.priceOffer} TL</td>
                  <td className="py-2 px-4 flex gap-2">
                    {/* Devam Et Butonu => /repairs/[id]/operations */}
                    <Link href={`/repairs/${repair.id}/operations`}>
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded cursor-pointer">
                        Devam Et
                      </span>
                    </Link>
                    {/* Rapor Butonu => /repairs/[id]/report */}
                    <Link href={`/repairs/${repair.id}/report`}>
                      <span className="bg-green-500 text-white px-2 py-1 rounded cursor-pointer">
                        Rapor
                      </span>
                    </Link>
                    {/* Sil Butonu */}
                    <button
                      onClick={() => deleteRepair(repair.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
