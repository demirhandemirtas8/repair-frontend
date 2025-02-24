"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// YENİ: apiClient import ediyoruz
import { apiClient } from "@/lib/apiClient";

interface RepairLog {
  id: number;
  changedAt: string;
  oldDescription?: string;
  newDescription?: string;
  note?: string;
}

interface RepairDetail {
  id: number;
  repairDate: string;
  issueDescription: string;
  status: string;
  priceOffer: number;
  qrCode?: string | null;
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
  const repairId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com";

  // ---- PDF Önizleme Fonksiyonu (Özelleştirilmiş) ----
  const handlePdfPreview = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("report-print-section");
      if (!element) return;

      // html2pdf ayarlarıyla kalite ve boyut artırımı
      const options = {
        margin: 10, // sayfa kenar boşluğu (px, pt vs.)
        filename: `tamir-raporu-${repairId}.pdf`,
        image: { type: "jpeg", quality: 1.0 }, // resim kalitesi
        html2canvas: {
          scale: 2, // ölçek faktörü (2 veya 3 yazarak kaliteyi artırabilirsiniz)
          logging: false,
          useCORS: true, // harici resimler için CORS
        },
        jsPDF: {
          unit: "pt", // ölçü birimi: pt (point), mm, cm vb.
          format: "a4", // sayfa boyutu: A4
          orientation: "portrait", // dikey
        },
      };

      await html2pdf().set(options).from(element).save();
      // Eğer direkt kaydetmek yerine önizleme isterseniz:
      // .toPdf().get('pdf').then((pdfObj: any) => {
      //   const pdfBlobUrl = pdfObj.output('bloburl');
      //   window.open(pdfBlobUrl, '_blank');
      // });
    } catch (err) {
      console.error("PDF önizleme hata:", err);
    }
  };

  useEffect(() => {
    if (!repairId) return;
    setLoading(true);
    Promise.all([fetchRepair(repairId), fetchLogs(repairId)])
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [repairId]);

  async function fetchRepair(id: string) {
    try {
      const res = await apiClient(`${baseUrl}/api/Repairs/${id}`, { method: "GET" });
      if (!res.ok) {
        console.error("Tamir verisi alınamadı:", await res.text());
        router.push("/repairs");
        return;
      }
      const data = await res.json();
      setRepair(data);
    } catch (error) {
      console.error("Tamir verisi çekilemedi:", error);
      router.push("/repairs");
    }
  }

  async function fetchLogs(id: string) {
    try {
      const res = await apiClient(`${baseUrl}/api/Repairs/${id}/logs`, { method: "GET" });
      if (!res.ok) {
        console.error("Log kayıtları çekilemedi:", await res.text());
        return;
      }
      const data = await res.json();
      setRepairLogs(data);
    } catch (error) {
      console.error("Log kayıtları çekilemedi:", error);
    }
  }

  async function generateAndSaveQrCode() {
    if (!repairId) return;
    try {
      const raporLink = `${window.location.origin}/repairs/${repairId}/report`;
      const qrRes = await apiClient(
        `${baseUrl}/api/Repairs/qr?text=${encodeURIComponent(raporLink)}`,
        { method: "GET" }
      );
      if (!qrRes.ok) {
        console.error("QR kod oluşturulamadı:", await qrRes.text());
        return;
      }
      const qrData = await qrRes.json(); // { qrCode: "data:image/png;base64,..." }

      const putBody = { qrCode: qrData.qrCode };
      const putRes = await apiClient(`${baseUrl}/api/Repairs/${repairId}`, {
        method: "PUT",
        body: JSON.stringify(putBody),
      });
      if (!putRes.ok) {
        console.error("Tamire QR kod kaydedilemedi:", await putRes.text());
        return;
      }
      fetchRepair(repairId);
    } catch (error) {
      console.error("QR kod oluşturulurken hata:", error);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) return <p className="min-h-screen p-6">Yükleniyor...</p>;
  if (!repair) return <p className="min-h-screen p-6">Rapor bulunamadı.</p>;

  // İşlemler + Parçalar toplamı
  const totalOps = repair.operations.reduce((acc, op) => acc + op.price, 0);
  const totalParts = repair.spareParts.reduce((acc, sp) => acc + sp.price, 0);
  const subTotal = totalOps + totalParts;

  // %20 KDV
  const kdv = subTotal * 0.2;
  const totalWithKdv = subTotal + kdv;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #report-print-section,
          #report-print-section * {
            visibility: visible !important;
          }
          #report-print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-r from-yellow-400 to-red-500 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-md p-6 space-y-4">
          <h1 className="text-2xl font-bold">Tamir Raporu #{repair.id}</h1>

          {/* Butonlar */}
          <div className="flex gap-3">
            <button
              onClick={generateAndSaveQrCode}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              QR Kod Oluştur
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Yazdır
            </button>
            <button
              onClick={handlePdfPreview}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              PDF Önizle
            </button>
            <button
              onClick={() => router.push("/repairs")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-auto"
            >
              Listeye Dön
            </button>
          </div>

          {/* Rapor Alanı */}
          <div id="report-print-section" className="p-4 bg-gray-50 rounded space-y-6">
            {/* Üst Satır: Logo (sol üst) ve QR Kod (sağ üst) */}
            <div className="flex justify-between items-start">
              {/* Logo */}
              <img
                src="https://defaticaret.com/cdn/shop/files/Adsiz_tasarim_18.png?v=1717177209&width=500"
                alt="Logo"
                className="w-40 h-auto"
                crossOrigin="anonymous"
              />

              {/* QR Kod (varsa) */}
              {repair.qrCode && (
                <div>
                  <img
                    src={repair.qrCode}
                    alt="QR Kod"
                    className="border p-1 w-40 h-40"
                  />
                </div>
              )}
            </div>

            {/* Müşteri & Makine Bilgisi */}
            <div className="space-y-1">
              <p>
                <strong>Müşteri:</strong> {repair.machine.customer.name}
              </p>
              <p>
                <strong>Makine Modeli:</strong> {repair.machine.model} (
                {repair.machine.serialNumber})
              </p>
              <p>
                <strong>Durum:</strong> {repair.status}
              </p>
              <p>
                <strong>Fiyat Teklifi (Kayıtlı):</strong> {repair.priceOffer}
              </p>
              <p>
                <strong>Tarih:</strong>{" "}
                {new Date(repair.repairDate).toLocaleString("tr-TR")}
              </p>
            </div>

            {/* İşlemler Tablosu */}
            <div>
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
            <div>
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

            {/* Toplam, KDV ve Genel Toplam */}
            <div className="p-4 bg-gray-100 rounded space-y-1">
              <p>
                <strong>Ara Toplam:</strong> {subTotal.toFixed(2)} TRY
              </p>
              <p>
                <strong>KDV (%20):</strong> {kdv.toFixed(2)} TRY
              </p>
              <p>
                <strong>Genel Toplam:</strong> {totalWithKdv.toFixed(2)} TRY
              </p>
            </div>

            {/* Log Kayıtları (varsa) */}
            {repairLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Log Kayıtları</h3>
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
                      <tr
                        key={log.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 px-4">
                          {new Date(log.changedAt).toLocaleString("tr-TR")}
                        </td>
                        <td
                          className="py-2 px-4"
                          dangerouslySetInnerHTML={{
                            __html: log.oldDescription || "",
                          }}
                        />
                        <td
                          className="py-2 px-4"
                          dangerouslySetInnerHTML={{
                            __html: log.newDescription || "",
                          }}
                        />
                        <td className="py-2 px-4">{log.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Arıza Açıklaması (En altta) */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Arıza Açıklaması</h3>
              <p className="whitespace-pre-line">{repair.issueDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
