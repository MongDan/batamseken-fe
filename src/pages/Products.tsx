import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatRupiah } from "../lib/formatter";
import { showSuccess, showError, showConfirm } from "../lib/alert";

interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  material: string;
  sell_price: number;
  buy_price: number;
  stock: number;
}
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  variants: ProductVariant[];
}

// --- FUNGSI UNTUK MEMECAH UKURAN DARI DATABASE ---
const parseSize = (sizeStr: string) => {
  if (!sizeStr) return { w: "", p: "" };
  const match = sizeStr.match(
    /(\d+(?:\.\d+)?)\s*(?:[xX*\/]|\s)\s*(\d+(?:\.\d+)?)/
  );
  if (match) return { w: match[1], p: match[2] };
  return { w: sizeStr, p: "" }; // Jika cuma 1 angka
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State form menggunakan 'width' dan 'length' sebagai pengganti 'size'
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    variants: [
      {
        id: "",
        sku: "",
        width: "",
        length: "",
        color: "",
        material: "",
        sell_price: 0,
        buy_price: 0,
        stock: 0
      }
    ]
  });

  const fetchProducts = () => {
    setLoading(true);
    apiFetch<{ data: Product[] }>("/api/products")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        showError("Gagal", "Tidak dapat memuat data produk.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          id: "",
          sku: "",
          width: "",
          length: "",
          color: "",
          material: "",
          sell_price: 0,
          buy_price: 0,
          stock: 0
        }
      ]
    });
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleVariantChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleCurrencyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: "buy_price" | "sell_price"
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    handleVariantChange(index, field, rawValue ? Number(rawValue) : 0);
  };

  // --- FUNGSI EDIT (PECAH UKURAN JADI LEBAR & PANJANG) ---
  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category || "",
      description: product.description || "",
      variants: product.variants.map((v) => {
        const { w, p } = parseSize(v.size);
        return {
          id: v.id,
          sku: v.sku,
          width: w,
          length: p, // Masukkan hasil pecahan ke state
          color: v.color,
          material: v.material,
          sell_price: v.sell_price,
          buy_price: v.buy_price,
          stock: v.stock
        };
      })
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    try {
      // --- GABUNGKAN LEBAR & PANJANG JADI SATU STRING 'size' ---
      const finalVariants = formData.variants.map((v) => {
        let finalSize = "";
        if (v.width && v.length) {
          finalSize = `${v.width} x ${v.length}`;
        } else if (v.width) {
          finalSize = v.width;
        }

        return {
          id: v.id,
          sku: v.sku,
          size: finalSize, // <-- Ini yang dikirim ke backend
          color: v.color,
          material: v.material,
          sell_price: v.sell_price,
          buy_price: v.buy_price,
          stock: v.stock
        };
      });

      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        variants: finalVariants
      };

      await apiFetch(url, { method, body: JSON.stringify(payload) });
      showSuccess(
        "Berhasil",
        editingId
          ? "Produk berhasil diupdate!"
          : "Produk baru berhasil ditambahkan!"
      );
      closeModal();
      fetchProducts();
    } catch (err: any) {
      showError("Gagal Menyimpan", err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await showConfirm(
      "Hapus Produk?",
      "Produk akan dihapus/dinonaktifkan."
    );
    if (!isConfirmed) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      showSuccess("Berhasil", "Produk berhasil dihapus/dinonaktifkan.");
      fetchProducts();
    } catch (err: any) {
      showError("Gagal Menghapus", err.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      category: "",
      description: "",
      variants: [
        {
          id: "",
          sku: "",
          width: "",
          length: "",
          color: "",
          material: "",
          sell_price: 0,
          buy_price: 0,
          stock: 0
        }
      ]
    });
  };

  if (loading)
    return <div className="text-center mt-10">Memuat data produk...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Produk & Stok</h1>
          <p className="text-sm text-secondary">
            Katalog furniture Batam Seken
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm w-full md:w-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>{" "}
          Tambah Produk
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">
                  Varian (Lbr x Pjg / Warna / Bahan)
                </th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">Harga Beli</th>
                <th className="py-3 px-4 text-right">Stok</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              {products.map((product) =>
                product.variants.map((variant, index) => (
                  <tr
                    key={variant.id}
                    className="hover:bg-surface-container-low/50"
                  >
                    {index === 0 && (
                      <td
                        className="py-3 px-4 font-medium"
                        rowSpan={product.variants.length}
                      >
                        {product.name}
                      </td>
                    )}
                    {index === 0 && (
                      <td
                        className="py-3 px-4"
                        rowSpan={product.variants.length}
                      >
                        <span className="bg-surface-container px-2 py-1 rounded-md text-xs">
                          {product.category || "Umum"}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono text-xs">
                      {variant.sku}
                    </td>
                    <td className="py-3 px-4 text-secondary whitespace-nowrap">
                      {variant.size} / {variant.color} / {variant.material}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary whitespace-nowrap">
                      {formatRupiah(Number(variant.sell_price))}
                    </td>
                    <td className="py-3 px-4 text-right text-secondary whitespace-nowrap">
                      {formatRupiah(Number(variant.buy_price))}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span
                        className={
                          variant.stock > 5 ? "text-green-600" : "text-red-500"
                        }
                      >
                        {variant.stock}
                      </span>
                    </td>
                    {index === 0 && (
                      <td
                        className="py-3 px-4 text-center"
                        rowSpan={product.variants.length}
                      >
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Edit Produk"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-secondary hover:text-error hover:bg-error-container rounded transition-colors"
                            title="Hapus Produk"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold">
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button
                onClick={closeModal}
                className="text-secondary hover:text-error p-2 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form
                id="product-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-secondary uppercase mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: Kasur Spring Bed"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-secondary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-secondary uppercase mb-1">
                      Kategori
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: Kasur / Lemari"
                      value={formData.category || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-secondary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-secondary uppercase mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    placeholder="Deskripsi singkat produk (opsional)..."
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-surface-container rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-secondary/50"
                  />
                </div>

                <div className="border-t border-surface-container pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold">Varian Produk</h3>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-colors"
                    >
                      + Tambah Varian
                    </button>
                  </div>

                  {formData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="bg-surface-container-low/30 p-4 rounded-xl mb-4 border border-surface-container space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          VARIAN {index + 1}
                        </span>
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="text-error text-xs font-semibold hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* BARIS 1: SKU, LEBAR, PANJANG, WARNA, BAHAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            SKU *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Cth: KRS-001"
                            value={variant.sku || ""}
                            onChange={(e) =>
                              handleVariantChange(index, "sku", e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Lebar *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Cth: 160"
                            value={variant.width || ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "width",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Panjang *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Cth: 200"
                            value={variant.length || ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "length",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Warna *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Cth: Putih"
                            value={variant.color || ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "color",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Bahan *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Cth: Kayu Jati"
                            value={variant.material || ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "material",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      {/* BARIS 2: HARGA BELI, HARGA JUAL, STOK */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Harga Beli *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">
                              Rp
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="0"
                              value={
                                variant.buy_price
                                  ? Number(variant.buy_price).toLocaleString(
                                      "id-ID"
                                    )
                                  : ""
                              }
                              onChange={(e) =>
                                handleCurrencyChange(e, index, "buy_price")
                              }
                              className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Harga Jual *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">
                              Rp
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="0"
                              value={
                                variant.sell_price
                                  ? Number(variant.sell_price).toLocaleString(
                                      "id-ID"
                                    )
                                  : ""
                              }
                              onChange={(e) =>
                                handleCurrencyChange(e, index, "sell_price")
                              }
                              className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-secondary mb-1">
                            Stok *
                          </label>
                          <input
                            type="number"
                            required
                            placeholder="0"
                            value={variant.stock || ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "stock",
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-surface-container flex justify-end gap-3 shrink-0">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-container rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-5 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-lg shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  save
                </span>{" "}
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
