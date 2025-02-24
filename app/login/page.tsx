"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // .env.local => NEXT_PUBLIC_API_URL=https://localhost:7166
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://repairserviceapi-2.onrender.com";

  async function handleLogin() {
    try {
      const res = await fetch(`${baseUrl}/api/Auth/Login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        console.error("Login başarısız:", await res.text());
        alert("Giriş başarısız! Kullanıcı adı/şifre hatalı olabilir.");
        return;
      }

      // Sunucudan token, belki refreshToken vs. gelebilir
      const data = await res.json();
      // data => { token: "JWT....", ... }

      // localStorage’a kaydediyoruz
      localStorage.setItem("token", data.token);

      // Yönlendirme
      router.push("/");
    } catch (error) {
      console.error("Login hata:", error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md p-6 rounded">
        <h1 className="text-2xl font-bold mb-4">Giriş Yap</h1>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
          <input
            type="text"
            className="border w-full p-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınızı giriniz"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Şifre</label>
          <input
            type="password"
            className="border w-full p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifrenizi giriniz"
          />
        </div>

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Giriş
        </button>
      </div>
    </div>
  );
}
