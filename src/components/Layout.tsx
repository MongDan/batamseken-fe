import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { showConfirm, showError } from "../lib/alert";
import { useIdleTimer } from "../hooks/useIdleTimer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string>("");
  const [isLoadingRole, setIsLoadingRole] = useState<boolean>(true);

  useEffect(() => {
    apiFetch<{ role: string }>("/api/user")
      .then((res: any) => {
        setUserRole(res.role);
        setIsLoadingRole(false);
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  // Logout Manual (Tombol Logout)
  const handleLogout = async () => {
    const isConfirmed = await showConfirm(
      "Logout?",
      "Anda akan keluar dari sesi ini."
    );
    if (isConfirmed) {
      try {
        await apiFetch("/api/logout", { method: "POST" });
        navigate("/login");
      } catch (err) {
        showError("Gagal Logout", "Terjadi kesalahan sistem.");
      }
    }
  };

  // Logout Otomatis (Idle 15 Menit)
  const handleAutoLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Auto logout error:", err);
    } finally {
      // Redirect tanpa alert konfirmasi
      navigate("/login");
    }
  };

  // Panggil Hook: 15 * 60 * 1000 = 15 menit
  useIdleTimer(handleAutoLogout, 15 * 60 * 1000);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "space_dashboard",
      roles: ["OWNER"]
    },
    {
      name: "Kasir (POS)",
      path: "/kasir",
      icon: "point_of_sale",
      roles: ["ADMIN", "OWNER"]
    },
    {
      name: "Produk & Stok",
      path: "/products",
      icon: "inventory_2",
      roles: ["OWNER"]
    },
    {
      name: "Riwayat Transaksi",
      path: "/transactions",
      icon: "receipt_long",
      // UBAH BAGIAN INI: Tambahkan "ADMIN"
      roles: ["ADMIN", "OWNER"]
    },
    {
      name: "Pelanggan",
      path: "/customers",
      icon: "group",
      // (Opsional) Jika Admin juga perlu lihat data pelanggan, tambahkan "ADMIN" di sini
      roles: ["OWNER"]
    },
    {
      name: "Audit Log",
      path: "/audit-logs",
      icon: "shield_person",
      roles: ["OWNER"]
    },
    {
      name: "Pengaturan",
      path: "/settings",
      icon: "settings",
      roles: ["OWNER"]
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#213145] text-slate-200 z-50 flex flex-col justify-between shadow-sm hidden md:flex">
        <div className="flex flex-col">
          <div className="p-4 flex items-center gap-3 border-b border-white/10">
            <span className="material-symbols-outlined text-3xl text-emerald-400">
              chair
            </span>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white">
                Batam Seken
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Cabang Kerinci
              </span>
            </div>
          </div>

          <div className="px-3 pt-6 pb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest px-2">
              Operasional
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-3 overflow-y-auto">
            {isLoadingRole ? (
              <div className="text-xs text-slate-500 px-3 py-2">
                Memuat menu...
              </div>
            ) : (
              menuItems.map((item) => {
                if (!item.roles.includes(userRole)) return null;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 flex flex-col gap-3">
          <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">Role Aktif</span>
                <span className="text-xs font-semibold text-white">
                  {userRole || "..."}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between px-4 md:px-8 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <span className="md:hidden font-bold text-primary">
              Batam Seken
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary"></span> Toko
              Buka
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg text-sm text-secondary">
              <span className="material-symbols-outlined text-[18px] mr-2">
                calendar_today
              </span>
              Hari Ini (
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
              )
            </div>
            <div className="flex items-center gap-3 pl-3 border-l border-surface-container">
              <div className="flex flex-col text-right hidden md:flex">
                <span className="text-sm font-semibold">
                  {userRole === "OWNER" ? "Owner" : "Kasir"}
                </span>
                <span className="text-[10px] text-secondary">{userRole}</span>
              </div>
              <button onClick={handleLogout} className="md:hidden text-error">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
