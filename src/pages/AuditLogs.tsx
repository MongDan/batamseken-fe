import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatDate } from "../lib/formatter";

interface AuditLog {
  id: string;
  user_role: string;
  action: string;
  entity: string;
  entity_id: string;
  reason: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    setErrorMsg(null);

    // Gunakan URLSearchParams agar URL bersih jika filter kosong
    const params = new URLSearchParams();
    if (filterAction !== "ALL") {
      params.append("action", filterAction);
    }
    if (startDate && endDate) {
      params.append("start_date", startDate);
      params.append("end_date", endDate);
    }

    const url = `/api/audit-logs?${params.toString()}`;

    // Gunakan any dulu untuk mengakomodasi struktur response
    apiFetch<any>(url)
      .then((res) => {
        // Cek apakah response langsung array atau masuk ke dalam res.data (pagination)
        const actualData = res.data?.data ? res.data.data : res.data;

        if (Array.isArray(actualData)) {
          setLogs(actualData);
        } else {
          setLogs([]);
          console.warn("Format data tidak sesuai:", res);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || "Gagal mengambil data audit log.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const getActionColor = (action: string) => {
    if (action.includes("DELETE"))
      return "bg-red-100 text-red-700 border-red-200";
    if (action.includes("VOID"))
      return "bg-orange-100 text-orange-700 border-orange-200";
    if (action.includes("RETURN"))
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (action.includes("CREATE"))
      // <--- TAMBAHKAN INI
      return "bg-green-100 text-green-700 border-green-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading)
    return <div className="text-center mt-10">Memuat catatan aktivitas...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            Audit Log (Jejak Aktivitas)
          </h1>
          <p className="text-sm text-secondary">
            Catatan kronologis aksi krusial pada sistem.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLogs();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">
              Aksi
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-surface-container rounded-lg text-sm font-semibold focus:outline-none"
            >
              <option value="ALL">Semua</option>
              <option value="CREATE_TRANSACTION">Buat Transaksi</option>{" "}
              {/* <--- TAMBAHKAN INI */}
              <option value="DELETE_TRANSACTION">Hapus Transaksi</option>
              <option value="VOID_TRANSACTION">Void Transaksi</option>
              <option value="RETURN_ITEM">Retur Barang</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">
              Dari
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-surface-container rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">
              Sampai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-surface-container rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Tampilkan Pesan Error Jika Ada */}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMsg}</span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Oleh</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Detail & Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-secondary">
                    Belum ada catatan.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-surface-container-low/50"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-secondary font-mono text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-xs uppercase bg-surface-container px-2 py-1 rounded">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary text-xs max-w-md">
                      {log.reason || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
