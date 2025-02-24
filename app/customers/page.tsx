"use client";

import { useState, useEffect } from "react";
// apiClient fonksiyonunu import ediyoruz
import { apiClient } from "@/lib/apiClient"; 

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  // Arka planda baseUrl'inizi alabilirsiniz
  // (örnek: https://localhost:7166/api)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com/api";

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // fetch yerine apiClient kullanıyoruz
      const res = await apiClient(`${baseUrl}/customers`);
      if (!res.ok) {
        console.error("Müşteriler çekilemedi:", await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error("Müşteriler çekilemedi:", error);
      setLoading(false);
    }
  };

  const addCustomer = async () => {
    if (!newCustomer.name) return;
    try {
      const res = await apiClient(`${baseUrl}/customers`, {
        method: "POST",
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        setNewCustomer({ name: "", email: "", phone: "" });
        fetchCustomers();
      } else {
        console.error("Müşteri eklenemedi:", await res.text());
      }
    } catch (error) {
      console.error("Müşteri eklenemedi:", error);
    }
  };

  const deleteCustomer = async (id: number) => {
    // Örnek: bir confirm popup ile kullanıcıya sorabiliriz
    if (!window.confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await apiClient(`${baseUrl}/customers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCustomers();
      } else {
        console.error("Müşteri silinemedi:", await res.text());
      }
    } catch (error) {
      console.error("Müşteri silinemedi:", error);
    }
  };

  if (loading) {
    return <p className="p-6">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Sayfa başlığı */}
      <div className="bg-white shadow-md rounded-md p-6">
        <h1 className="text-2xl font-bold mb-4">Müşteriler</h1>
        <p className="text-gray-600">
          Müşterilerinizi burada görüntüleyebilir, ekleyebilir ve yönetebilirsiniz.
        </p>
      </div>

      {/* Müşteri ekleme kartı */}
      <div className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-xl font-semibold mb-4">Müşteri Ekle</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Adı"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="email"
            placeholder="Email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="text"
            placeholder="Telefon"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <button
            onClick={addCustomer}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Müşteri listesi kartı */}
      <div className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-xl font-semibold mb-4">Müşteri Listesi</h2>
        {customers.length === 0 ? (
          <p>Hiç müşteri yok.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Adı</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Telefon</th>
                <th className="py-2 px-4 text-left">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100`}
                >
                  <td className="py-2 px-4">{customer.id}</td>
                  <td className="py-2 px-4">{customer.name}</td>
                  <td className="py-2 px-4">{customer.email}</td>
                  <td className="py-2 px-4">{customer.phone}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      className="bg-red-500 text-white px-2 py-1 mr-2 rounded hover:bg-red-600"
                    >
                      Sil
                    </button>
                    {/* Güncelle sayfası eklemek isterseniz: 
                        <Link href={`/customers/edit/${customer.id}`}>
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded cursor-pointer hover:bg-yellow-600">
                            Güncelle
                          </span>
                        </Link>
                    */}
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
