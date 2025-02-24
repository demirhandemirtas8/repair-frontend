"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient"; // <-- Burada apiClient fonksiyonunu import ediyoruz

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id;

  const [machine, setMachine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // .env.local => NEXT_PUBLIC_API_URL=https://localhost:7166
  // final rota: https://localhost:7166/api/machines
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com/api";

  useEffect(() => {
    if (!machineId) return;

    const actualId = Array.isArray(machineId) ? machineId[0] : machineId;
    fetchMachine(actualId);
  }, [machineId]);

  async function fetchMachine(id: string) {
    try {
      // fetch yerine apiClient kullanıyoruz
      const res = await apiClient(`${apiUrl}/machines/${id}`, {
        method: "GET",
      });

      if (!res.ok) {
        // Makine bulunamazsa veya hata alırsak
        router.push("/machines");
        return;
      }
      const data = await res.json();
      setMachine(data);
      setLoading(false);
    } catch (error) {
      console.error("Makine detayları çekilemedi:", error);
      router.push("/machines");
    }
  }

  if (loading) {
    return <p className="container mx-auto p-4">Yükleniyor...</p>;
  }

  if (!machine) {
    return (
      <div className="container mx-auto p-4">
        <p>Makine bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-md p-6">
      <h1 className="text-2xl font-bold mb-4">Makine Detayları</h1>
      <div className="space-y-2">
        <p>
          <strong>ID:</strong> {machine.id}
        </p>
        <p>
          <strong>Seri No:</strong> {machine.serialNumber}
        </p>
        <p>
          <strong>Model:</strong> {machine.model}
        </p>
        <p>
          <strong>Teslim Durumu:</strong>{" "}
          {machine.isDelivered ? "Evet" : "Hayır"}
        </p>
        <p>
          <strong>Fiyat:</strong>{" "}
          {machine.price ? `${machine.price} TL` : "-"}
        </p>
        <p>
          <strong>Fatura No:</strong> {machine.invoiceNumber || "-"}
        </p>
      </div>

      {machine.qrCode && (
        <div className="mt-6">
          <p className="font-semibold mb-2">QR Kod:</p>
          <img
            src={machine.qrCode}
            alt="QR Kod"
            className="border p-2 bg-gray-50"
          />
        </div>
      )}
    </div>
  );
}
