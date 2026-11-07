import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { showSuccess, showError, showConfirm, showPrompt } from "../lib/alert";

interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  material: string;
  sell_price: string | number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  variants: ProductVariant[];
}

interface CartItem extends ProductVariant {
  productName: string;
  qty: number;
  serial_number?: string;
  subtotal: number;
  sell_price: number;
}

interface TransactionItem {
  product_name_snapshot: string;
  variant_snapshot: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  serial_number?: string;
}

interface TransactionData {
  id: string;
  invoice_no: string;
  created_at: string;
  payment_method: string;
  subtotal: number;
  total: number;
  cash_received: number;
  change: number;
  note: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: TransactionItem[];
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(value);
};

export default function Kasir() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [lastTransaction, setLastTransaction] =
    useState<TransactionData | null>(null);

  useEffect(() => {
    apiFetch<{ data: Product[] }>("/api/products")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showError("Gagal Memuat", "Tidak dapat mengambil data produk.");
        setLoading(false);
      });

    apiFetch<{ data: { qris_image_url: string | null } }>("/api/store")
      .then((res) => {
        const rawUrl = res.data.qris_image_url;
        if (rawUrl) {
          const fullUrl = rawUrl.startsWith("http")
            ? rawUrl
            : `http://localhost:8000${rawUrl}`;
          setQrisUrl(fullUrl);
        } else {
          setQrisUrl(null);
        }
      })
      .catch((err) => console.error("Gagal load QRIS:", err));
  }, []);

  const addToCart = (productName: string, variant: ProductVariant) => {
    const price = Number(variant.sell_price);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === variant.id);
      if (existingItem) {
        if (existingItem.qty >= variant.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === variant.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * price }
            : item
        );
      }
      return [
        ...prevCart,
        { ...variant, sell_price: price, productName, qty: 1, subtotal: price }
      ];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === variantId) {
            const newQty = item.qty - 1;
            return { ...item, qty: newQty, subtotal: newQty * item.sell_price };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const handleSerialNumber = async (variantId: string) => {
    const sn = await showPrompt(
      "Nomor Seri (Opsional)",
      `Masukkan nomor seri untuk produk ini (kosongkan jika tidak ada):`
    );
    if (sn !== null && sn !== undefined) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === variantId ? { ...item, serial_number: sn } : item
        )
      );
    }
  };

  const resetCart = async () => {
    const isConfirmed = await showConfirm(
      "Kosongkan Keranjang?",
      "Semua barang yang dipilih akan dihapus."
    );
    if (isConfirmed) setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const change = Math.max(0, cashReceived - cartTotal);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCashInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setCashReceived(rawValue ? Number(rawValue) : 0);
  };

  const handleProceedPayment = () => {
    if (cart.length === 0)
      return showError(
        "Keranjang Kosong",
        "Silakan pilih barang terlebih dahulu."
      );
    if (!customer.name || !customer.phone || !customer.address)
      return showError(
        "Data Belum Lengkap",
        "Nama, No. HP, dan Alamat pelanggan wajib diisi."
      );

    if (paymentMethod === "CASH") {
      if (cashReceived < cartTotal)
        return showError(
          "Uang Kurang",
          "Uang yang diterima tidak mencukupi total belanja."
        );
      submitTransaction();
    } else {
      setShowQrisModal(true);
    }
  };

  const submitTransaction = async () => {
    setIsProcessing(true);
    setShowQrisModal(false);

    try {
      const payload = {
        customer: customer,
        items: cart.map((item) => ({
          variant_id: item.id,
          qty: item.qty,
          serial_number: item.serial_number
        })),
        payment_method: paymentMethod,
        cash_received: paymentMethod === "CASH" ? Number(cashReceived) : 0,
        note: note
      };

      const response = await apiFetch<{ data: TransactionData }>(
        "/api/transactions",
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

      setLastTransaction(response.data);
      showSuccess("Transaksi Berhasil", "Struk siap dicetak.");

      setCart([]);
      setCustomer({ name: "", phone: "", address: "" });
      setCashReceived(0);
      setNote("");

      const refreshProducts = await apiFetch<{ data: Product[] }>(
        "/api/products"
      );
      setProducts(refreshProducts.data);
    } catch (err: any) {
      showError("Gagal Transaksi", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return <div className="text-center mt-10">Memuat katalog produk...</div>;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* KIRI: Katalog Produk */}
        <div className="flex-1 w-full min-w-0">
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm mb-4 border border-surface-container">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) =>
              product.variants.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => addToCart(product.name, variant)}
                  className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-surface-container flex flex-col justify-between cursor-pointer hover:border-primary transition-all group"
                >
                  <div>
                    <span className="text-[10px] font-mono text-secondary bg-surface-container px-2 py-0.5 rounded-full uppercase inline-block truncate max-w-full">
                      {product.category || "Umum"}
                    </span>
                    <h3 className="font-bold text-on-surface mt-2 line-clamp-2 text-sm">
                      {product.name}
                    </h3>

                    {/* UKURAN DIBIKIN 1 KOLOM TEKS BIASA */}
                    <p className="text-xs text-secondary mt-1 truncate">
                      {variant.size} / {variant.color}
                    </p>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-secondary">Harga</p>
                      <p className="font-bold text-primary text-sm">
                        {formatRupiah(Number(variant.sell_price))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-secondary">Stok</p>
                      <p
                        className={`font-bold text-sm ${variant.stock > 0 ? "text-on-surface" : "text-error"}`}
                      >
                        {variant.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KANAN: Keranjang */}
        <aside className="w-full xl:w-[400px] shrink-0 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] flex flex-col bg-surface-container-lowest rounded-xl shadow-md border border-surface-container overflow-y-auto">
          <div className="p-4 border-b border-surface-container bg-surface-container-low/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                shopping_cart
              </span>
              <h2 className="font-bold text-lg">Pesanan</h2>
            </div>
            <button
              onClick={resetCart}
              className="text-xs text-error hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                delete_sweep
              </span>{" "}
              Reset
            </button>
          </div>

          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-secondary text-sm mt-10">
                Belum ada barang dipilih.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold truncate">
                      {item.productName}
                    </p>

                    {/* UKURAN DI KERANJANG JUGA DIBIKIN 1 KOLOM TEKS */}
                    <p className="text-[11px] text-secondary truncate mt-1">
                      {item.size} / {item.color}
                    </p>

                    <button
                      onClick={() => handleSerialNumber(item.id)}
                      className="text-[10px] text-blue-600 hover:underline text-left mt-1 block"
                    >
                      {item.serial_number
                        ? `SN: ${item.serial_number}`
                        : "+ Tambah SN"}
                    </button>

                    <p className="text-sm font-bold text-primary mt-1">
                      {formatRupiah(item.subtotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 bg-surface-container rounded flex items-center justify-center hover:bg-error-container"
                    >
                      <span className="material-symbols-outlined text-sm">
                        remove
                      </span>
                    </button>
                    <span className="font-bold text-sm w-4 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => addToCart(item.productName, item)}
                      className="w-6 h-6 bg-primary text-on-primary rounded flex items-center justify-center hover:bg-primary-container"
                    >
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-surface-container space-y-4 bg-surface-container-lowest mt-auto">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Data Pelanggan
              </p>
              <input
                type="text"
                placeholder="Nama Pelanggan"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-surface-container-low rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="No. HP"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-surface-container-low rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                placeholder="Alamat"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-1.5 bg-surface-container-low rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex justify-between items-end border-t border-surface-container pt-3">
              <span className="text-sm font-semibold text-secondary">
                Total Tagihan
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatRupiah(cartTotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-lg">
              <button
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-1 ${paymentMethod === "CASH" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-secondary"}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  payments
                </span>{" "}
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod("QRIS")}
                className={`py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-1 ${paymentMethod === "QRIS" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-secondary"}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  qr_code_scanner
                </span>{" "}
                QRIS
              </button>
            </div>

            {paymentMethod === "CASH" && (
              <div className="space-y-2 bg-surface-container-low/50 p-3 rounded-lg">
                <label className="text-xs text-secondary font-medium">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={
                      cashReceived ? cashReceived.toLocaleString("id-ID") : ""
                    }
                    onChange={handleCashInput}
                    className="w-full pl-10 pr-3 py-2 bg-surface-container-lowest rounded font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-between items-center bg-primary/10 p-2 rounded text-primary mt-2">
                  <span className="text-sm font-semibold">Kembalian:</span>
                  <span className="font-bold text-lg">
                    {formatRupiah(change)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleProceedPayment}
              disabled={isProcessing || cart.length === 0}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <span className="material-symbols-outlined">print</span>
              {isProcessing ? "Memproses..." : "PROSES TRANSAKSI"}
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL QRIS */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-6 text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Pembayaran QRIS
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Arahkan kamera HP pelanggan ke QR di bawah.
            </p>
            <div className="bg-primary/10 w-full py-4 rounded-xl mb-6 border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-1">
                Total Tagihan
              </p>
              <p className="text-4xl font-extrabold text-primary">
                {formatRupiah(cartTotal)}
              </p>
            </div>
            <div className="w-64 h-64 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center mb-6 overflow-hidden p-2">
              {qrisUrl ? (
                <img
                  src={qrisUrl}
                  alt="QRIS"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-1">
                    qr_code_2
                  </span>
                  <p className="text-xs">QRIS belum diatur.</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-6 px-4">
              Pastikan notifikasi pembayaran sudah masuk sebelum menekan tombol
              di bawah.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowQrisModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={submitTransaction}
                disabled={isProcessing}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container shadow-md"
              >
                {isProcessing ? "Memproses..." : "Sudah Dibayar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FAKTUR */}
      {lastTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm my-8 overflow-hidden">
            <div
              id="receipt-print-area"
              className="p-6 bg-white text-black font-mono text-xs"
            >
              <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                <h2 className="text-lg font-bold uppercase tracking-wide">
                  Batam Seken Furniture
                </h2>
                <p className="text-[10px] mt-1">Cabang Kerinci</p>
                <p className="text-[10px]">Telp: 0811-7788-9900</p>
              </div>
              <div className="text-[10px] space-y-0.5 mb-3">
                <div className="flex justify-between">
                  <span>No Faktur:</span>
                  <span className="font-bold">
                    {lastTransaction.invoice_no}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>
                    {new Date(lastTransaction.created_at).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>Admin</span>
                </div>
              </div>
              <div className="border-t border-b border-dashed border-gray-400 py-2 mb-3 text-[10px]">
                <p className="font-bold">Pelanggan:</p>
                <p>{lastTransaction.customer.name}</p>
                <p>{lastTransaction.customer.phone}</p>
                <p className="leading-tight">
                  {lastTransaction.customer.address}
                </p>
              </div>
              <div className="space-y-2 mb-3">
                {lastTransaction.items.map((item, idx) => (
                  <div key={idx} className="text-[10px]">
                    <p className="font-bold">{item.product_name_snapshot}</p>
                    <p className="text-[9px] text-gray-600">
                      {item.variant_snapshot}
                    </p>
                    {item.serial_number && (
                      <p className="text-[9px] text-gray-600">
                        SN: {item.serial_number}
                      </p>
                    )}
                    <div className="flex justify-between">
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
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(Number(lastTransaction.subtotal))}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(Number(lastTransaction.total))}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Metode:</span>
                  <span>{lastTransaction.payment_method}</span>
                </div>
                {lastTransaction.payment_method === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span>Diterima:</span>
                      <span>
                        {formatRupiah(Number(lastTransaction.cash_received))}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Kembalian:</span>
                      <span>
                        {formatRupiah(Number(lastTransaction.change))}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {lastTransaction.note && (
                <div className="border-t border-dashed border-gray-400 pt-2 mt-2 text-[10px]">
                  <p className="font-bold">Catatan:</p>
                  <p className="italic">{lastTransaction.note}</p>
                </div>
              )}
              <div className="text-center border-t border-dashed border-gray-400 pt-3 mt-3 text-[9px]">
                <p className="font-bold">Terima Kasih</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setLastTransaction(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-container transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  print
                </span>{" "}
                Cetak Faktur
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
