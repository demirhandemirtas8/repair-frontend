"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient"; // <-- apiClient fonksiyonunu import

export default function MachinesPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // .env.local => NEXT_PUBLIC_API_URL=https://localhost:7166
  // Tam rota: https://localhost:7166/api/machines
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com/api";

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      // fetch yerine apiClient kullanıyoruz
      const res = await apiClient(`${apiUrl}/machines`, {
        method: "GET",
      });
      if (!res.ok) {
        console.error("Makineler çekilemedi:", await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMachines(data);
      setLoading(false);
    } catch (error) {
      console.error("Makineler çekilemedi:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-md p-6">
        <h1 className="text-2xl font-bold mb-4">Makineler</h1>
        <p className="text-gray-600">
          Kayıtlı makinelerinizi burada görüntüleyebilirsiniz.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-xl font-semibold mb-4">Makine Listesi</h2>
        {loading ? (
          <p>Yükleniyor...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Seri No</th>
                <th className="py-2 px-4 text-left">Model</th>
                <th className="py-2 px-4 text-left">Teslim Edildi mi?</th>
                <th className="py-2 px-4 text-left">Fiyat</th>
                <th className="py-2 px-4 text-left">Fatura No</th>
                <th className="py-2 px-4 text-left">Detay</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine, index) => (
                <tr
                  key={machine.id}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100`}
                >
                  <td className="py-2 px-4">{machine.id}</td>
                  <td className="py-2 px-4">{machine.serialNumber}</td>
                  <td className="py-2 px-4">{machine.model}</td>
                  <td className="py-2 px-4">
                    {machine.isDelivered ? "Evet" : "Hayır"}
                  </td>
                  <td className="py-2 px-4">
                    {machine.price ? `${machine.price} TL` : "-"}
                  </td>
                  <td className="py-2 px-4">
                    {machine.invoiceNumber || "-"}
                  </td>
                  <td className="py-2 px-4">
                    <Link href={`/machine/${machine.id}`}>
                      <span className="bg-blue-500 text-white px-2 py-1 rounded cursor-pointer">
                        İncele
                      </span>
                    </Link>
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
