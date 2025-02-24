// lib/apiClient.ts

/** 
 * API isteklerini yönetmek için bir yardımcı fonksiyon.
 * Her isteğe otomatik olarak "Content-Type" ve (varsa) "Authorization" ekler.
 */
export async function apiClient(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Örnek: Token'ı localStorage'da sakladığınızı varsayıyoruz.
    // Not: SSR ortamında localStorage olmadığı için window check yapıyoruz.
    let token: string | null = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }
  
    // Headers nesnesi oluşturuyoruz (daha sonra ekleme yapacağız).
    const headers = new Headers(options.headers || {});
    
    // Her istekte JSON gönderdiğimizi varsayıyoruz:
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  
    // Token varsa Authorization ekle
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  
    // Son fetch ayarları:
    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };
  
    // İstek at
    const response = await fetch(url, fetchOptions);
  
    // Örnek: 401 geldiğinde logout vb. yapabilirsiniz
    if (response.status === 401) {
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
  
    return response;
  }
  