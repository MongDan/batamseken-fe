import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getCsrfCookie } from "../lib/api";

interface LoginResponse {
  status: string;
  message: string;
  user: {
    id: string;
    name: string;
    role: "ADMIN" | "OWNER";
  };
}

export default function Login() {
  const [activeTab, setActiveTab] = useState<"kasir" | "owner">("kasir");
  const [pin, setPin] = useState<string>("");
  const [email, setEmail] = useState<string>("owner@batamseken.com");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLoginKasir = async () => {
    if (pin.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await getCsrfCookie();
      await apiFetch<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({ login_type: "admin", pin }),
      });
      navigate("/kasir");
    } catch (err: any) {
      setError(err.message || "PIN yang dimasukkan salah.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await getCsrfCookie();
      await apiFetch<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({ login_type: "owner", email, password }),
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 6) setPin(pin + digit);
  };
  const handlePinBackspace = () => setPin(pin.slice(0, -1));
  const handlePinClear = () => setPin("");

  // Dukungan keyboard fisik untuk input PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "kasir") return;
      if (/^[0-9]$/.test(e.key)) handlePinPress(e.key);
      else if (e.key === "Backspace") handlePinBackspace();
      else if (e.key === "Escape") handlePinClear();
      else if (e.key === "Enter") handleLoginKasir();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, activeTab]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background font-sans text-on-surface">
      <div className="flex flex-col w-full max-w-md mx-auto items-center justify-center relative">
        
        {/* Top Status Ribbon */}
        <div className="w-full mb-4 flex items-center justify-between px-4 py-2 bg-surface-container rounded-full shadow-sm text-secondary text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>Terminal 01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-secondary font-normal">Online</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl shadow-slate-900/5 p-5 sm:p-8">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center pb-6">
            <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-3xl">chair</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Batam Seken</h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">Sistem Kasir & Manajemen Toko</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error-container text-error p-3 rounded-lg mb-4 text-xs sm:text-sm text-center font-medium border border-error/20">
              {error}
            </div>
          )}

          {/* Segmented Role Selector */}
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-lg gap-1 mb-6">
            <button
              onClick={() => { setActiveTab("kasir"); setError(""); }}
              className={`py-2.5 px-2 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${activeTab === "kasir" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-secondary hover:text-on-surface"}`}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">point_of_sale</span>
              Kasir
            </button>
            <button
              onClick={() => { setActiveTab("owner"); setError(""); }}
              className={`py-2.5 px-2 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${activeTab === "owner" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-secondary hover:text-on-surface"}`}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              Owner
            </button>
          </div>

          {/* KASIR VIEW (PIN) */}
          {activeTab === "kasir" && (
            <div className="flex flex-col animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">PIN Terminal</p>
                  <p className="text-xs text-secondary">Akses kasir toko</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] font-bold">Buka</span>
              </div>

              {/* PIN Indicators */}
              <div className="mb-6 flex flex-col items-center">
                <div className="flex justify-between items-center w-full max-w-[280px] gap-1.5 sm:gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-10 h-12 sm:w-12 sm:h-14 rounded-lg flex items-center justify-center transition-all ${i < pin.length ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface"}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${i < pin.length ? "bg-white scale-125" : "bg-slate-300"}`}></span>
                    </div>
                  ))}
                </div>
                <div className={`h-4 mt-3 text-[11px] sm:text-xs text-center ${pin.length === 6 ? "text-primary font-semibold" : "text-secondary"}`}>
                  {pin.length === 6 ? "PIN Lengkap." : pin.length > 0 ? `${pin.length} / 6 digit` : "Masukkan 6 digit PIN"}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[280px] sm:max-w-xs mx-auto mb-6">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button key={num} onClick={() => handlePinPress(num)} className="h-12 sm:h-14 bg-surface-container-low hover:bg-surface-container active:scale-95 transition rounded-lg text-lg sm:text-xl font-mono text-on-surface flex items-center justify-center" type="button">{num}</button>
                ))}
                <button onClick={handlePinClear} className="h-12 sm:h-14 bg-error-container/30 hover:bg-error-container text-error active:scale-95 transition rounded-lg text-sm font-semibold flex items-center justify-center" type="button">C</button>
                <button onClick={() => handlePinPress("0")} className="h-12 sm:h-14 bg-surface-container-low hover:bg-surface-container active:scale-95 transition rounded-lg text-lg sm:text-xl font-mono text-on-surface flex items-center justify-center" type="button">0</button>
                <button onClick={handlePinBackspace} className="h-12 sm:h-14 bg-surface-container-low hover:bg-surface-container active:scale-95 transition rounded-lg text-secondary flex items-center justify-center" type="button">
                  <span className="material-symbols-outlined text-xl">backspace</span>
                </button>
              </div>

              <button
                onClick={handleLoginKasir}
                disabled={loading || pin.length !== 6}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl text-sm sm:text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Memverifikasi..." : "Masuk Kasir"}</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          )}

          {/* OWNER VIEW (Email & Password) */}
          {activeTab === "owner" && (
            <div className="flex flex-col animate-fadeIn">
              <div className="mb-5">
                <p className="text-sm font-bold text-on-surface">Portal Pemilik</p>
                <p className="text-xs text-secondary">Akses analitik & laporan</p>
              </div>

              <form onSubmit={handleLoginOwner} className="flex flex-col gap-4">
                {/* Email */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-secondary font-semibold mb-1.5">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-surface-container-low text-on-surface py-2.5 pl-10 pr-3 rounded-lg text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
                      placeholder="owner@batamseken.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-secondary font-semibold mb-1.5">Kata Sandi</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-surface-container-low text-on-surface py-2.5 pl-10 pr-12 rounded-lg text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••"
                    />
                    {/* Tombol Ikon Mata */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:text-on-surface rounded-md hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl text-sm sm:text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>{loading ? "Memproses..." : "Masuk Owner"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Footer Metrics */}
          <div className="mt-8 pt-4 border-t border-surface-container flex items-center justify-between text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-[10px] font-mono">Sistem Aktif</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="material-symbols-outlined text-sm text-primary">cloud_done</span>
              <span>v2.4.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}