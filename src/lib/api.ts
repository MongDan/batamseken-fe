// Ubah dari URL Railway menjadi kosong
export const API_BASE_URL = ""; 

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  return null;
}

interface FetchOptions extends RequestInit {
  method?: string;
}

export const apiFetch = async <T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const method = options.method || "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>)
  };

  // Cek apakah data yang dikirim adalah FormData (seperti upload gambar)
  const isFormData = options.body instanceof FormData;

  // Jika POST/PUT/DELETE, otomatis sisipkan token CSRF
  if (method !== "GET" && method !== "HEAD") {
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    // Ambil token XSRF dari cookie dan masukkan ke header
    const xsrfToken = getCookie("XSRF-TOKEN");
    if (xsrfToken) {
      headers["X-XSRF-TOKEN"] = xsrfToken;
    }
  }

  // WAJIB: credentials 'include' untuk mengirim/menerima cookie lintas domain
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server");
  }

  return data as T;
};

export const getCsrfCookie = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    credentials: "include"
  });
};
