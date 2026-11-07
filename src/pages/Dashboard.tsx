import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatRupiah } from "../lib/formatter";

interface TopProduct {
  product_name_snapshot: string;
  total_sold: number;
  total_revenue: number;
}
interface ProductMargin {
  product_name_snapshot: string;
  total_margin: number;
}
interface DailySale {
  date: string;
  total: number;
}
interface ReportData {
  revenue: number;
  transactions: number;
  margin: number;
  start_date: string;
  end_date: string;
  top_products: TopProduct[];
  product_margins: ProductMargin[];
  daily_sales: DailySale[];
}

export default function Dashboard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const [startDate, setStartDate] = useState<string>(
    sevenDaysAgo.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(today);

  const fetchReport = () => {
    setLoading(true);
    apiFetch<{ data: ReportData }>(
      `/api/reports/dashboard?start_date=${startDate}&end_date=${endDate}`
    )
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExport = (type: "transactions" | "products") => {
    window.open(`http://localhost:8000/api/export/${type}`, "_blank");
  };

  const fillDateRange = (start: string, end: string, data: DailySale[]) => {
    const result: DailySale[] = [];
    const startD = new Date(start),
      endD = new Date(end);
    const dataMap = new Map(data.map((d) => [d.date, Number(d.total)]));
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, total: dataMap.get(dateStr) || 0 });
    }
    return result;
  };

  const chartData = data
    ? fillDateRange(data.start_date, data.end_date, data.daily_sales)
    : [];
  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
            Executive Analytics
          </span>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight mt-1">
            Ringkasan Toko
          </h1>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchReport();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">
              Dari
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-surface-container"
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
              className="px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-surface-container"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-sm h-[38px]"
          >
            Terapkan
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleExport("transactions")}
          className="flex items-center gap-2 bg-surface-container-lowest border border-surface-container hover:border-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">
            download
          </span>{" "}
          Ekspor Transaksi
        </button>
        <button
          onClick={() => handleExport("products")}
          className="flex items-center gap-2 bg-surface-container-lowest border border-surface-container hover:border-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">
            download
          </span>{" "}
          Ekspor Produk
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Memuat...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <span className="text-[11px] font-semibold text-secondary uppercase">
                Total Omzet
              </span>
              <div className="text-3xl font-bold text-on-surface mt-2">
                {formatRupiah(data?.revenue || 0)}
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <span className="text-[11px] font-semibold text-secondary uppercase">
                Volume Transaksi
              </span>
              <div className="text-3xl font-bold text-on-surface mt-2">
                {data?.transactions || 0}{" "}
                <span className="text-lg font-medium text-secondary">Nota</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <span className="text-[11px] font-semibold text-secondary uppercase">
                Margin Keuntungan
              </span>
              <div className="text-3xl font-bold text-primary mt-2">
                {formatRupiah(data?.margin || 0)}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">Tren Penjualan Harian</h2>
            <div className="relative h-64 flex items-end gap-2 pb-8 border-b border-surface-container">
              {chartData.map((d, i) => {
                const heightPercent = (d.total / maxChartValue) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div className="absolute bottom-full mb-2 bg-[#213145] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {formatRupiah(d.total)}
                    </div>
                    <div
                      className="w-full max-w-[40px] rounded-t-md bg-primary/60 group-hover:bg-primary"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: d.total > 0 ? "4px" : "0"
                      }}
                    ></div>
                    <span className="absolute -bottom-6 text-[10px] font-mono text-secondary">
                      {d.date.split("-").slice(2).join("/")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabel Produk Terlaris */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
              <div className="p-4 border-b bg-surface-container-low">
                <h2 className="font-bold">Produk Terlaris</h2>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-surface-container">
                  {data?.top_products.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-4 font-medium">
                        {item.product_name_snapshot}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {item.total_sold} unit
                      </td>
                      <td className="py-3 px-4 text-right text-primary font-bold">
                        {formatRupiah(Number(item.total_revenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabel Margin per Produk */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
              <div className="p-4 border-b bg-surface-container-low">
                <h2 className="font-bold">Margin Keuntungan per Produk</h2>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-surface-container">
                  {data?.product_margins.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-4 font-medium">
                        {item.product_name_snapshot}
                      </td>
                      <td className="py-3 px-4 text-right text-primary font-bold">
                        {formatRupiah(Number(item.total_margin))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
