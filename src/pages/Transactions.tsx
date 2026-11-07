import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatRupiah, formatDate } from "../lib/formatter";
import { showConfirm, showPrompt, showError, showSuccess } from "../lib/alert";

interface Customer {
  name: string;
  phone: string;
  address: string;
}
interface TransactionItem {
  id: string;
  variant_id: string;
  product_name_snapshot: string;
  variant_snapshot: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}
interface Transaction {
  id: string;
  invoice_no: string;
  created_at: string;
  payment_method: string;
  total: number;
  status: string;
  customer: Customer;
  items: TransactionItem[];
}

// --- FUNGSI FORMAT NOMOR HP OTOMATIS ---
const formatPhoneNumber = (phone: string) => {
  if (!phone) return "-";
  // Hapus semua karakter selain angka
  const cleaned = phone.replace(/\D/g, "");
  // Sisipkan tanda hubung setiap 4 digit
  return cleaned.replace(/(\d{4})(?=\d)/g, "$1-");
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // State Modal Retur
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<
    { variant_id: string; name: string; max_qty: number; qty: number }[]
  >([]);
  const [returnReason, setReturnReason] = useState("");

  const userRole = localStorage.getItem("user_role") || "ADMIN";

  const fetchTransactions = () => {
    setLoading(true);
    apiFetch<{ data: Transaction[] }>("/api/transactions")
      .then((res) => {
        setTransactions(res.data);
        setLoading(false);
      })
      .catch(() => {
        showError("Gagal", "Tidak dapat memuat data transaksi.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleVoid = async (id: string) => {
    const isConfirmed = await showConfirm(
      "Batalkan Transaksi?",
      "Stok semua barang akan dikembalikan."
    );
    if (!isConfirmed) return;
    try {
      await apiFetch(`/api/transactions/${id}/void`, { method: "POST" });
      showSuccess("Berhasil", "Transaksi dibatalkan dan stok dikembalikan.");
      fetchTransactions();
      setSelectedTrx(null);
    } catch (err: any) {
      showError("Gagal Membatalkan", err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = await showPrompt(
      "Hapus Permanen",
      "Masukkan alasan penghapusan (wajib):"
    );
    if (!reason) return;
    try {
      await apiFetch(`/api/transactions/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason })
      });
      showSuccess("Dihapus", "Transaksi dihapus permanen.");
      fetchTransactions();
      setSelectedTrx(null);
    } catch (err: any) {
      showError("Gagal Menghapus", err.message);
    }
  };

  // --- LOGIKA RETUR ---
  const openReturnModal = () => {
    if (!selectedTrx) return;
    setReturnItems(
      selectedTrx.items.map((i) => ({
        variant_id: i.variant_id,
        name: i.product_name_snapshot,
        max_qty: i.qty,
        qty: 0
      }))
    );
    setReturnReason("");
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredItems = returnItems.filter((i) => i.qty > 0);
    if (filteredItems.length === 0)
      return showError("Pilih Barang", "Pilih minimal 1 barang untuk diretur.");
    if (!returnReason) return showError("Alasan", "Masukkan alasan retur.");

    try {
      await apiFetch(`/api/transactions/${selectedTrx?.id}/return`, {
        method: "POST",
        body: JSON.stringify({
          items: filteredItems.map((i) => ({
            variant_id: i.variant_id,
            qty: i.qty
          })),
          reason: returnReason
        })
      });
      showSuccess("Berhasil", "Barang berhasil diretur dan stok dikembalikan.");
      setShowReturnModal(false);
      setSelectedTrx(null);
      fetchTransactions();
    } catch (err: any) {
      showError("Gagal Retur", err.message);
    }
  };

  // --- LOGIKA SHARE WA ---
  const handleShareWa = () => {
    if (!selectedTrx) return;
    // Format nomor HP ke format internasional untuk WA (628...)
    const phone = selectedTrx.customer.phone
      .replace(/^0/, "62")
      .replace(/\D/g, "");
    const text = `Halo ${selectedTrx.customer.name}, terima kasih telah berbelanja di Batam Seken.\n\nNo Faktur: ${selectedTrx.invoice_no}\nTanggal: ${formatDate(selectedTrx.created_at)}\nTotal: ${formatRupiah(selectedTrx.total)}\n\nBarang yang dibeli tidak dapat ditukar/dikembalikan.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  if (loading)
    return <div className="text-center mt-10">Memuat riwayat transaksi...</div>;

  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
        <div className="p-4 border-b border-surface-container bg-surface-container-low/30">
          <h1 className="text-xl font-bold text-on-surface">
            Riwayat Transaksi
          </h1>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="sticky top-0 bg-surface-container-low z-10">
              <tr className="text-secondary text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              {transactions.map((trx) => (
                <tr
                  key={trx.id}
                  className={`hover:bg-surface-container-low/50 cursor-pointer ${selectedTrx?.id === trx.id ? "bg-primary/5" : ""}`}
                  onClick={() => setSelectedTrx(trx)}
                >
                  <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                    {trx.invoice_no}
                  </td>
                  <td className="py-3 px-4 text-secondary whitespace-nowrap">
                    {formatDate(trx.created_at)}
                  </td>
                  <td className="py-3 px-4 truncate max-w-[150px]">
                    {trx.customer?.name || "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-primary whitespace-nowrap">
                    {formatRupiah(trx.total)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${trx.status === "COMPLETED" ? "bg-primary/10 text-primary" : trx.status === "VOID" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}
                    >
                      {trx.status === "COMPLETED"
                        ? "Selesai"
                        : trx.status === "VOID"
                          ? "Dibatalkan"
                          : "Dihapus"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTrx && (
        <div className="w-full xl:w-[450px] shrink-0 bg-surface-container-lowest rounded-xl shadow-md border border-surface-container flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-surface-container-low">
            <h3 className="font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                receipt_long
              </span>{" "}
              Detail Nota
            </h3>
            <button
              onClick={() => setSelectedTrx(null)}
              className="text-secondary hover:text-error p-1 rounded-md"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 bg-surface-container-lowest">
            <div
              id="receipt-print-area"
              className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm font-mono text-xs text-black"
            >
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-lg font-bold uppercase">Batam Seken</h2>
                {/* UBAH TEKS CABANG DI SINI */}
                <p className="text-[10px] mt-1 text-gray-500">Cabang Kerinci</p>
                <div className="mt-2 font-bold bg-gray-100 py-1 rounded">
                  {selectedTrx.invoice_no}
                </div>
              </div>
              <div className="mb-4 space-y-1">
                <p>Tgl : {formatDate(selectedTrx.created_at)}</p>
                <p>Nama: {selectedTrx.customer.name}</p>
                {/* GUNAKAN FUNGSI FORMAT HP DI SINI */}
                <p>Telp: {formatPhoneNumber(selectedTrx.customer.phone)}</p>
                <p>Almt: {selectedTrx.customer.address}</p>
              </div>
              <div className="space-y-3 border-y border-dashed py-4 mb-4">
                {selectedTrx.items.map((item, idx) => (
                  <div key={idx}>
                    <p className="font-bold">{item.product_name_snapshot}</p>
                    <p className="text-[10px] text-gray-500">
                      {item.variant_snapshot}
                    </p>
                    <div className="flex justify-between mt-1">
                      <span>
                        {item.qty} x {formatRupiah(Number(item.unit_price))}
                      </span>
                      <span className="font-bold">
                        {formatRupiah(Number(item.subtotal))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>{formatRupiah(selectedTrx.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Metode</span>
                <span>{selectedTrx.payment_method}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t flex flex-col gap-2 bg-surface-container-low/30">
            {selectedTrx.status === "COMPLETED" && (
              <>
                <button
                  onClick={() => handleVoid(selectedTrx.id)}
                  className="w-full py-2 bg-orange-100 text-orange-700 font-semibold rounded-lg hover:bg-orange-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    block
                  </span>{" "}
                  Batalkan Transaksi
                </button>
                <button
                  onClick={openReturnModal}
                  className="w-full py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    assignment_return
                  </span>{" "}
                  Retur Barang
                </button>
                <button
                  onClick={handleShareWa}
                  className="w-full py-2 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chat
                  </span>{" "}
                  Kirim Struk ke WA
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    print
                  </span>{" "}
                  Cetak Struk
                </button>
              </>
            )}

            {selectedTrx.status !== "DELETED" && userRole === "OWNER" && (
              <button
                onClick={() => handleDelete(selectedTrx.id)}
                className="w-full py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete_forever
                </span>{" "}
                Hapus Permanen
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL RETUR BARANG */}
      {showReturnModal && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold">Retur Barang</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-secondary hover:text-error"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-4 space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-3">
                {returnItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-secondary">
                        Maks: {item.max_qty}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={item.max_qty}
                      value={item.qty || ""}
                      onChange={(e) => {
                        const val = Math.min(
                          item.max_qty,
                          Math.max(0, Number(e.target.value))
                        );
                        const newItems = [...returnItems];
                        newItems[idx].qty = val;
                        setReturnItems(newItems);
                      }}
                      className="w-16 px-2 py-1 text-center bg-white border border-gray-300 rounded font-bold text-black"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Alasan Retur *
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border rounded-lg text-sm text-black"
                  placeholder="Misal: Barang cacat"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white font-bold rounded-lg text-sm"
                >
                  Proses Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
