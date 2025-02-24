"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// IMPORTANT: Import your apiClient
import { apiClient } from "@/lib/apiClient";

export default function NewRepairPage() {
  const router = useRouter();

  // Form alanları
  const [repairDate, setRepairDate] = useState<string>(() => {
    // Varsayılan olarak bugünün tarihini 'yyyy-MM-ddThh:mm' formatında verelim (datetime-local için)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  const [issueDescription, setIssueDescription] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  // Yeni Makine Ekleme Formu
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachineSerial, setNewMachineSerial] = useState("");
  const [newMachineModel, setNewMachineModel] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com/api";

  // Müşterileri çek
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Using apiClient now
      const res = await apiClient(`${apiUrl}/customers`);
      if (!res.ok) {
        console.error("Müşteriler çekilemedi:", await res.text());
        return;
      }
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Müşteriler çekilemedi:", error);
    }
  };

  // Seçili müşteri değiştiğinde makineleri çek
  useEffect(() => {
    if (!selectedCustomer) {
      setMachines([]);
      setSelectedMachine("");
      return;
    }
    fetchMachines(selectedCustomer);
  }, [selectedCustomer]);

  const fetchMachines = async (customerId: string) => {
    try {
      // Using apiClient now
      const res = await apiClient(`${apiUrl}/machines?customerId=${customerId}`);
      if (!res.ok) {
        console.error("Makineler çekilemedi:", await res.text());
        return;
      }
      const data = await res.json();
      setMachines(data);
      setSelectedMachine("");
    } catch (error) {
      console.error("Makineler çekilemedi:", error);
    }
  };

  // Yeni Makine Ekle
  const handleAddMachine = async () => {
    if (!selectedCustomer) {
      alert("Önce müşteri seçmelisiniz.");
      return;
    }
    if (!newMachineSerial || !newMachineModel) {
      alert("Makine seri numarası ve modeli zorunludur.");
      return;
    }
    try {
      const body = {
        serialNumber: newMachineSerial,
        model: newMachineModel,
        customerId: parseInt(selectedCustomer, 10),
      };
      // Using apiClient
      const res = await apiClient(`${apiUrl}/machines`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Makine ekleme hatası:", await res.text());
        return;
      }
      // Makine eklendikten sonra listeyi güncelle
      setShowAddMachine(false);
      setNewMachineSerial("");
      setNewMachineModel("");
      fetchMachines(selectedCustomer);
    } catch (error) {
      console.error("Makine eklenemedi:", error);
    }
  };

  // Taslak Kaydet (POST /repairs) => status: "Taslak"
  const handleSaveDraft = async () => {
    if (!selectedCustomer || !selectedMachine) {
      alert("Müşteri ve makine seçimi zorunludur.");
      return;
    }
    const body = {
      repairDate,
      issueDescription,
      status: "Taslak",
      priceOffer: 0,
      machineId: parseInt(selectedMachine, 10),
    };
    try {
      // Using apiClient
      const res = await apiClient(`${apiUrl}/repairs`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Taslak kaydetme hatası:", await res.text());
        return;
      }
      const newRepair = await res.json();
      alert(`Taslak kaydedildi. Repair ID: ${newRepair.id}`);
    } catch (error) {
      console.error("Taslak kaydedilemedi:", error);
    }
  };

  // Devam Et => Taslak oluşturup, /repairs/[id]/operations sayfasına yönlendirme
  const handleContinue = async () => {
    if (!selectedCustomer || !selectedMachine) {
      alert("Müşteri ve makine seçimi zorunludur.");
      return;
    }
    const body = {
      repairDate,
      issueDescription,
      status: "Taslak",
      priceOffer: 0,
      machineId: parseInt(selectedMachine, 10),
    };
    try {
      // Using apiClient
      const res = await apiClient(`${apiUrl}/repairs`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Tamir oluşturma hatası:", await res.text());
        return;
      }
      const newRepair = await res.json();
      // İşlemler & yedek parçalar ekranına yönlendir
      router.push(`/repairs/${newRepair.id}/operations`);
    } catch (error) {
      console.error("Tamir oluşturulamadı:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-500 p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Yeni Tamir Oluştur
        </h1>

        {/* Tarih */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Tarih</label>
          <input
            type="datetime-local"
            value={repairDate}
            onChange={(e) => setRepairDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>

        {/* Açıklama */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Açıklama</label>
          <input
            type="text"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            placeholder="Arıza veya sorun açıklaması"
          />
        </div>

        {/* Müşteri Seçimi */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Müşteri Seç</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          >
            <option value="">Seçiniz</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Makine Seçimi */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Makine Seç</label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            disabled={!selectedCustomer}
          >
            <option value="">Seçiniz</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.model} - {m.serialNumber}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddMachine(!showAddMachine)}
            className="mt-2 text-blue-600 underline text-sm"
            disabled={!selectedCustomer}
          >
            Yeni Makine Ekle
          </button>
        </div>

        {/* Yeni Makine Ekle Formu (Opsiyonel Modal veya Inline) */}
        {showAddMachine && (
          <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
            <h2 className="font-semibold mb-2">Makine Ekle</h2>
            <div className="mb-2">
              <input
                type="text"
                value={newMachineSerial}
                onChange={(e) => setNewMachineSerial(e.target.value)}
                placeholder="Seri No"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
              />
              <input
                type="text"
                value={newMachineModel}
                onChange={(e) => setNewMachineModel(e.target.value)}
                placeholder="Model"
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            <button
              onClick={handleAddMachine}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Makine Kaydet
            </button>
          </div>
        )}

        {/* Butonlar: Taslak Kaydet / Devam Et */}
        <div className="flex gap-4 justify-end mt-6">
          <button
            onClick={handleSaveDraft}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Taslak Kaydet
          </button>
          <button
            onClick={handleContinue}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
