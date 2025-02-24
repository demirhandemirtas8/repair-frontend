"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// YENİ: apiClient import ediyoruz
import { apiClient } from "@/lib/apiClient";

// ------------------ INTERFACES ------------------

// Tüm İşlemler (Global)
interface GlobalOperation {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
}

// Tamire Eklenmiş Operation
interface RepairOperation {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
}

// Tüm Parçalar (Global)
interface GlobalSparePart {
  id: number;
  partName: string;
  price: number;
  currency: string;
}

// Tamire Eklenmiş Parça
interface RepairSparePart {
  id: number;
  partName: string;
  price: number;
  currency: string;
}

// Log kaydı
interface RepairLog {
  id: number;
  oldDescription?: string;
  newDescription?: string;
  changedAt: string;
  note?: string;
}

// Tekil tamir kaydı (detay)
interface RepairDetail {
  id: number;
  issueDescription: string; // Burada metnimizi saklıyoruz
  priceOffer: number;
  machine: {
    model: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
  operations: RepairOperation[];
  spareParts: RepairSparePart[];
}

export default function RepairOperationsPage() {
  const router = useRouter();
  const rawId = useParams().id;
  const repairId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ------------------ STATE ------------------
  // Tamir kaydı
  const [repair, setRepair] = useState<RepairDetail | null>(null);

  // Tüm İşlemler (Global)
  const [globalOps, setGlobalOps] = useState<GlobalOperation[]>([]);
  // Yeni Global İşlem Ekle
  const [newGlobalOpName, setNewGlobalOpName] = useState("");
  const [newGlobalOpDesc, setNewGlobalOpDesc] = useState("");
  const [newGlobalOpPrice, setNewGlobalOpPrice] = useState("");
  const [newGlobalOpCurrency, setNewGlobalOpCurrency] = useState("TRY");

  // Bu Tamire Eklenmiş İşlemler
  const [repairOps, setRepairOps] = useState<RepairOperation[]>([]);

  // Tüm Parçalar (Global)
  const [globalParts, setGlobalParts] = useState<GlobalSparePart[]>([]);
  // Yeni Global Parça Ekle
  const [newGlobalPartName, setNewGlobalPartName] = useState("");
  const [newGlobalPartPrice, setNewGlobalPartPrice] = useState("");
  const [newGlobalPartCurrency, setNewGlobalPartCurrency] = useState("TRY");

  // Bu Tamire Eklenmiş Parçalar
  const [repairParts, setRepairParts] = useState<RepairSparePart[]>([]);

  // Log Kayıtları
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([]);

  // **Basit textarea** için açıklama değeri
  const [descValue, setDescValue] = useState<string>("");

  // Yükleniyor durumu
  const [loading, setLoading] = useState(true);

  // API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com";

  // ------------------ USEEFFECT ------------------
  useEffect(() => {
    if (!repairId) {
      console.error("Geçersiz repairId");
      return;
    }
    (async () => {
      setLoading(true);
      await fetchRepair();
      await fetchLogs();
      await fetchGlobalOperations();
      await fetchRepairOperations();
      await fetchGlobalSpareParts();
      await fetchRepairSpareParts();
      setLoading(false);
    })();
  }, [repairId]);

  // ------------------ 1) TAMİR KAYDI (REPAIR) ------------------
  async function fetchRepair() {
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}`, { method: "GET" });
      if (!res.ok) {
        console.error("Tamir detayı alınamadı:", await res.text());
        return;
      }
      const data = (await res.json()) as RepairDetail;
      setRepair(data);

      // Mevcut açıklamayı textarea'ya set edelim
      if (data.issueDescription) {
        setDescValue(data.issueDescription);
      }
    } catch (error) {
      console.error("Tamir detayı çekilemedi:", error);
    }
  }

  // ------------------ LOG LİSTESİ ------------------
  async function fetchLogs() {
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/logs`, { method: "GET" });
      if (!res.ok) {
        console.error("Log kayıtları çekilemedi:", await res.text());
        return;
      }
      const data = (await res.json()) as RepairLog[];
      setRepairLogs(data);
    } catch (error) {
      console.error("Log kayıtları çekilemedi:", error);
    }
  }

  // Açıklamayı kaydet + log ekle
  async function handleSaveDescription() {
    if (!repair) return;

    const oldDesc = repair.issueDescription;
    const newDesc = descValue;

    // 1) PUT /api/Repairs/{id} ile açıklamayı güncelle
    try {
      const body = { issueDescription: newDesc };
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Açıklama güncellenemedi:", await res.text());
        return;
      }
    } catch (error) {
      console.error("Açıklama güncelleme hatası:", error);
      return;
    }

    // 2) Log ekle: POST /api/Repairs/{repairId}/logs
    try {
      const logBody = {
        oldDescription: oldDesc,
        newDescription: newDesc,
        note: "Açıklama güncellendi",
      };
      const logRes = await apiClient(`${apiUrl}/api/Repairs/${repairId}/logs`, {
        method: "POST",
        body: JSON.stringify(logBody),
      });
      if (!logRes.ok) {
        console.error("Log eklenemedi:", await logRes.text());
      }
    } catch (error) {
      console.error("Log ekleme hatası:", error);
    }

    // Repair ve logları yeniden çek
    await fetchRepair();
    await fetchLogs();
    alert("Açıklama güncellendi ve log eklendi.");
  }

  // ------------------ 2) GLOBAL OPERATIONS + REPAIR OPERATIONS ------------------
  async function fetchGlobalOperations() {
    try {
      const res = await apiClient(`${apiUrl}/api/operations`, { method: "GET" });
      if (!res.ok) {
        console.error("Tüm işlemler çekilemedi:", await res.text());
        return;
      }
      const data = (await res.json()) as GlobalOperation[];
      setGlobalOps(data);
    } catch (error) {
      console.error("Tüm işlemler çekilemedi:", error);
    }
  }

  async function addGlobalOperation() {
    if (!newGlobalOpName || !newGlobalOpPrice) {
      alert("İşlem adı ve fiyat zorunlu.");
      return;
    }
    try {
      const body = {
        name: newGlobalOpName,
        description: newGlobalOpDesc,
        price: parseFloat(newGlobalOpPrice),
        currency: newGlobalOpCurrency,
      };
      const res = await apiClient(`${apiUrl}/api/operations`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Yeni işlem eklenemedi:", await res.text());
        return;
      }
      setNewGlobalOpName("");
      setNewGlobalOpDesc("");
      setNewGlobalOpPrice("");
      setNewGlobalOpCurrency("TRY");
      fetchGlobalOperations();
    } catch (error) {
      console.error("Yeni işlem eklenemedi:", error);
    }
  }

  async function fetchRepairOperations() {
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/operations`, { method: "GET" });
      if (!res.ok) {
        console.error("Tamire eklenmiş işlemler çekilemedi:", await res.text());
        return;
      }
      const data = (await res.json()) as RepairOperation[];
      setRepairOps(data);
    } catch (error) {
      console.error("Tamire eklenmiş işlemler çekilemedi:", error);
    }
  }

  async function addGlobalOpToRepair(op: GlobalOperation) {
    try {
      const body = [
        {
          name: op.name,
          description: op.description,
          price: op.price,
          currency: op.currency,
        },
      ];
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/operations`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("İşlem eklenemedi:", await res.text());
        return;
      }
      fetchRepairOperations();
    } catch (error) {
      console.error("İşlem eklenemedi:", error);
    }
  }

  async function deleteAllRepairOperations() {
    if (!confirm("Bu tamire eklenmiş tüm işlemleri silmek istediğinize emin misiniz?")) return;
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/operations`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("İşlemler silinemedi:", await res.text());
        return;
      }
      fetchRepairOperations();
    } catch (error) {
      console.error("İşlemler silinemedi:", error);
    }
  }

  async function deleteSingleOperation(opId: number) {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/operations/${opId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("İşlem silinemedi:", await res.text());
        return;
      }
      fetchRepairOperations();
    } catch (error) {
      console.error("İşlem silme hatası:", error);
    }
  }

  // ------------------ 3) GLOBAL SPAREPARTS + REPAIR SPAREPARTS ------------------
  async function fetchGlobalSpareParts() {
    try {
      const res = await apiClient(`${apiUrl}/api/spareParts`, { method: "GET" });
      if (!res.ok) {
        console.error("Tüm parçalar çekilemedi:", await res.text());
        return;
      }
      const data = (await res.json()) as GlobalSparePart[];
      setGlobalParts(data);
    } catch (error) {
      console.error("Tüm parçalar çekilemedi:", error);
    }
  }

  async function addGlobalSparePart() {
    if (!newGlobalPartName || !newGlobalPartPrice) {
      alert("Parça adı ve fiyat zorunlu.");
      return;
    }
    try {
      const body = {
        partName: newGlobalPartName,
        price: parseFloat(newGlobalPartPrice),
        currency: newGlobalPartCurrency,
      };
      const res = await apiClient(`${apiUrl}/api/spareParts`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Yeni parça eklenemedi:", await res.text());
        return;
      }
      setNewGlobalPartName("");
      setNewGlobalPartPrice("");
      setNewGlobalPartCurrency("TRY");
      fetchGlobalSpareParts();
    } catch (error) {
      console.error("Yeni parça eklenemedi:", error);
    }
  }

  async function fetchRepairSpareParts() {
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/spareParts`, { method: "GET" });
      if (!res.ok) {
        console.error("Tamire eklenmiş parçalar çekilemedi:", await res.text());
        return;
      }
      const data = (await res.json()) as RepairSparePart[];
      setRepairParts(data);
    } catch (error) {
      console.error("Tamire eklenmiş parçalar çekilemedi:", error);
    }
  }

  async function addGlobalPartToRepair(part: GlobalSparePart) {
    try {
      const body = [
        {
          partName: part.partName,
          price: part.price,
          currency: part.currency,
        },
      ];
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/spareParts`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Parça eklenemedi:", await res.text());
        return;
      }
      fetchRepairSpareParts();
    } catch (error) {
      console.error("Parça eklenemedi:", error);
    }
  }

  async function deleteAllRepairParts() {
    if (!confirm("Bu tamire eklenmiş tüm yedek parçaları silmek istediğinize emin misiniz?")) return;
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/spareParts`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Parçalar silinemedi:", await res.text());
        return;
      }
      fetchRepairSpareParts();
    } catch (error) {
      console.error("Parçalar silinemedi:", error);
    }
  }

  async function deleteSinglePart(partId: number) {
    if (!confirm("Bu yedek parçayı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}/spareParts/${partId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Parça silinemedi:", await res.text());
        return;
      }
      fetchRepairSpareParts();
    } catch (error) {
      console.error("Parça silme hatası:", error);
    }
  }

  // ------------------ 4) TEKLİF KAYDETME ------------------
  const totalOperations = repairOps.reduce((acc, op) => acc + op.price, 0);
  const totalParts = repairParts.reduce((acc, sp) => acc + sp.price, 0);
  const total = totalOperations + totalParts;

  async function savePriceOffer(amount: number) {
    if (!confirm(`Toplam tutar ${amount} olarak kaydedilsin mi?`)) return;
    try {
      const body = { priceOffer: amount };
      const res = await apiClient(`${apiUrl}/api/Repairs/${repairId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Fiyat teklifi kaydedilemedi:", await res.text());
        return;
      }
      alert("Fiyat teklifi kaydedildi!");
      // Tekrar tamir detayı çekelim (priceOffer güncellenmiş halini görmek için)
      fetchRepair();
    } catch (error) {
      console.error("Fiyat teklifi kaydedilemedi:", error);
    }
  }

  // ------------------ RENDER ------------------
  if (loading) return <p className="min-h-screen p-6">Yükleniyor...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 to-pink-500 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-md p-6 space-y-6">
        {/* Üst Kısım: Müşteri & Makine Bilgisi */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">
            Tamir İşlemleri (ID: {repairId})
          </h1>
          {repair && (
            <p className="text-gray-700">
              <span className="font-semibold">Müşteri:</span>{" "}
              {repair.machine?.customer?.name} &nbsp;|&nbsp;
              <span className="font-semibold">Makine Modeli:</span>{" "}
              {repair.machine?.model}
            </p>
          )}
        </div>

        {/* Tüm İşlemler (Global) */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Tüm İşlemler</h2>
          {globalOps.length === 0 ? (
            <p>Henüz global işlem tanımlanmamış.</p>
          ) : (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Adı</th>
                  <th className="py-2 px-4 text-left">Açıklama</th>
                  <th className="py-2 px-4 text-left">Fiyat</th>
                  <th className="py-2 px-4 text-left">Kur</th>
                  <th className="py-2 px-4 text-left">Ekle</th>
                </tr>
              </thead>
              <tbody>
                {globalOps.map((op) => (
                  <tr key={op.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{op.name}</td>
                    <td className="py-2 px-4">{op.description}</td>
                    <td className="py-2 px-4">{op.price}</td>
                    <td className="py-2 px-4">{op.currency}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => addGlobalOpToRepair(op)}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Ekle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Yeni Global İşlem Ekle */}
          <div className="border p-4 bg-white rounded shadow-sm">
            <h3 className="font-semibold mb-2">Yeni Global İşlem Ekle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                placeholder="İşlem Adı"
                value={newGlobalOpName}
                onChange={(e) => setNewGlobalOpName(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Açıklama"
                value={newGlobalOpDesc}
                onChange={(e) => setNewGlobalOpDesc(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Fiyat"
                value={newGlobalOpPrice}
                onChange={(e) => setNewGlobalOpPrice(e.target.value)}
                className="border p-2 rounded"
              />
              <select
                value={newGlobalOpCurrency}
                onChange={(e) => setNewGlobalOpCurrency(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <button
              onClick={addGlobalOperation}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
        </div>

        {/* Bu Tamire Eklenmiş İşlemler */}
        <div className="bg-gray-50 p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Bu Tamire Eklenmiş İşlemler</h2>
            <button
              onClick={deleteAllRepairOperations}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Hepsini Sil
            </button>
          </div>
          {repairOps.length === 0 ? (
            <p>Henüz bu tamire eklenmiş işlem yok.</p>
          ) : (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Adı</th>
                  <th className="py-2 px-4 text-left">Açıklama</th>
                  <th className="py-2 px-4 text-left">Fiyat</th>
                  <th className="py-2 px-4 text-left">Kur</th>
                  <th className="py-2 px-4 text-left">Sil</th>
                </tr>
              </thead>
              <tbody>
                {repairOps.map((op) => (
                  <tr key={op.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{op.name}</td>
                    <td className="py-2 px-4">{op.description}</td>
                    <td className="py-2 px-4">{op.price}</td>
                    <td className="py-2 px-4">{op.currency}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => deleteSingleOperation(op.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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

        {/* Tüm Parçalar (Global) */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Tüm Parçalar</h2>
          {globalParts.length === 0 ? (
            <p>Henüz global parça tanımlanmamış.</p>
          ) : (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Parça Adı</th>
                  <th className="py-2 px-4 text-left">Fiyat</th>
                  <th className="py-2 px-4 text-left">Kur</th>
                  <th className="py-2 px-4 text-left">Ekle</th>
                </tr>
              </thead>
              <tbody>
                {globalParts.map((gp) => (
                  <tr key={gp.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{gp.partName}</td>
                    <td className="py-2 px-4">{gp.price}</td>
                    <td className="py-2 px-4">{gp.currency}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => addGlobalPartToRepair(gp)}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Ekle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Yeni Global Parça Ekle */}
          <div className="border p-4 bg-white rounded shadow-sm">
            <h3 className="font-semibold mb-2">Yeni Global Parça Ekle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                placeholder="Parça Adı"
                value={newGlobalPartName}
                onChange={(e) => setNewGlobalPartName(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Fiyat"
                value={newGlobalPartPrice}
                onChange={(e) => setNewGlobalPartPrice(e.target.value)}
                className="border p-2 rounded"
              />
              <select
                value={newGlobalPartCurrency}
                onChange={(e) => setNewGlobalPartCurrency(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <button
              onClick={addGlobalSparePart}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
        </div>

        {/* Bu Tamire Eklenmiş Parçalar */}
        <div className="bg-gray-50 p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Bu Tamire Eklenmiş Parçalar</h2>
            <button
              onClick={deleteAllRepairParts}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Hepsini Sil
            </button>
          </div>
          {repairParts.length === 0 ? (
            <p>Henüz bu tamire eklenmiş parça yok.</p>
          ) : (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Parça Adı</th>
                  <th className="py-2 px-4 text-left">Fiyat</th>
                  <th className="py-2 px-4 text-left">Kur</th>
                  <th className="py-2 px-4 text-left">Sil</th>
                </tr>
              </thead>
              <tbody>
                {repairParts.map((part) => (
                  <tr key={part.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{part.partName}</td>
                    <td className="py-2 px-4">{part.price}</td>
                    <td className="py-2 px-4">{part.currency}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => deleteSinglePart(part.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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

        {/* Basit TEXTAREA: Açıklama + Loglar */}
        <div className="border p-4 bg-white rounded shadow-sm">
          <h2 className="text-xl font-bold mb-2">Tamir Açıklaması (Basit Textarea)</h2>
          <textarea
            className="w-full h-40 border p-2 rounded"
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
          />

          <button
            onClick={handleSaveDescription}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Kaydet
          </button>
        </div>

        {/* Log Kayıtları Tablosu */}
        <div className="border p-4 bg-white rounded shadow-sm">
          <h2 className="text-xl font-bold mb-2">Log Kayıtları</h2>
          {repairLogs.length === 0 ? (
            <p>Henüz log kaydı yok.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Tarih</th>
                  <th className="py-2 px-4 text-left">Eski Açıklama</th>
                  <th className="py-2 px-4 text-left">Yeni Açıklama</th>
                  <th className="py-2 px-4 text-left">Not</th>
                </tr>
              </thead>
              <tbody>
                {repairLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {new Date(log.changedAt).toLocaleString("tr-TR")}
                    </td>
                    <td
                      className="py-2 px-4"
                      dangerouslySetInnerHTML={{ __html: log.oldDescription || "" }}
                    />
                    <td
                      className="py-2 px-4"
                      dangerouslySetInnerHTML={{ __html: log.newDescription || "" }}
                    />
                    <td className="py-2 px-4">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Teklif Paneli (İşlemler + Parçalar) */}
        <PriceOfferPanel
          repairOps={repairOps}
          repairParts={repairParts}
          onSave={savePriceOffer}
        />
      </div>
    </div>
  );
}

/** Teklif Paneli Bileşeni */
function PriceOfferPanel({
  repairOps,
  repairParts,
  onSave,
}: {
  repairOps: { price: number }[];
  repairParts: { price: number }[];
  onSave: (amount: number) => void;
}) {
  const totalOperations = repairOps.reduce((acc, op) => acc + op.price, 0);
  const totalParts = repairParts.reduce((acc, sp) => acc + sp.price, 0);
  const total = totalOperations + totalParts;

  return (
    <div className="p-4 bg-gray-100 rounded shadow-sm flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Toplam Tutar</h3>
        <p className="text-xl font-bold">{total} TRY</p>
      </div>
      <button
        onClick={() => onSave(total)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Fiyat Teklifini Kaydet
      </button>
    </div>
  );
}
