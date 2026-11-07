import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { showSuccess, showError } from '../lib/alert';

interface StoreData {
  name: string;
  address: string;
  phone: string;
  qris_image_url: string | null;
}

export default function Settings() {
  // State Profil Toko
  const [store, setStore] = useState<StoreData>({ name: '', address: '', phone: '', qris_image_url: null });
  const [loadingStore, setLoadingStore] = useState(true);

  // State Ganti PIN
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // State Upload QRIS
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ data: StoreData }>('/api/store')
      .then((res) => {
        const rawUrl = res.data.qris_image_url;
        const fullUrl = rawUrl && !rawUrl.startsWith('http') ? `http://localhost:8000${rawUrl}` : rawUrl;
        
        setStore({ ...res.data, qris_image_url: fullUrl });
        setLoadingStore(false);
      })
      .catch((err) => {
        console.error(err);
        showError('Gagal Memuat', 'Tidak dapat mengambil data toko.');
        setLoadingStore(false);
      });
  }, []);

  // --- SIMPAN PROFIL TOKO ---
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/store', {
        method: 'PUT',
        body: JSON.stringify({ name: store.name, address: store.address, phone: store.phone })
      });
      showSuccess('Berhasil', 'Profil toko berhasil diperbarui!');
    } catch (err: any) {
      showError('Gagal Update', err.message);
    }
  };

  // --- UPLOAD QRIS ---
  const handleUploadQris = async () => {
    if (!qrisFile) return showError('Pilih File', 'Silakan pilih gambar QRIS terlebih dahulu.');
    setQrisLoading(true);
    const formData = new FormData();
    formData.append('qris_image', qrisFile);

    try {
      const res = await apiFetch<{ qris_url: string }>('/api/store/qris', {
        method: 'POST',
        body: formData as any 
      });
      
      const fullUrl = res.qris_url.startsWith('http') ? res.qris_url : `http://localhost:8000${res.qris_url}`;
      
      showSuccess('Berhasil', 'Gambar QRIS berhasil diunggah!');
      setStore({ ...store, qris_image_url: fullUrl });
      setQrisFile(null);
    } catch (err: any) {
      showError('Gagal Upload', err.message);
    } finally {
      setQrisLoading(false);
    }
  };

  // --- GANTI PIN ADMIN ---
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6) return showError('PIN Tidak Valid', 'PIN harus 6 digit angka.');
    if (newPin !== confirmPin) return showError('PIN Tidak Cocok', 'Konfirmasi PIN tidak cocok.');

    setPinLoading(true);
    try {
      await apiFetch('/api/store/admin-pin', {
        method: 'PUT',
        body: JSON.stringify({ new_pin: newPin })
      });
      showSuccess('Berhasil', 'PIN Admin berhasil diubah! Admin harus login ulang.');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      showError('Gagal Ganti PIN', err.message);
    } finally {
      setPinLoading(false);
    }
  };

  if (loadingStore) return <div className="text-center mt-10 text-secondary">Memuat pengaturan...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Pengaturan Toko</h1>
        <p className="text-sm text-secondary">Konfigurasi profil toko, QRIS, dan keamanan akses.</p>
      </div>

      {/* SECTION 1: PROFIL TOKO */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container">
        <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4 border-b border-surface-container pb-2">
          <span className="material-symbols-outlined text-primary">storefront</span>
          Profil Toko
        </h2>
        <form onSubmit={handleUpdateStore} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nama Toko</label>
              <input 
                type="text" 
                value={store.name} 
                onChange={(e) => setStore({ ...store, name: e.target.value })} 
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg border border-surface-container focus:ring-2 focus:ring-primary outline-none text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nomor HP / WhatsApp</label>
              <input 
                type="text" 
                value={store.phone} 
                onChange={(e) => setStore({ ...store, phone: e.target.value })} 
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg border border-surface-container focus:ring-2 focus:ring-primary outline-none text-sm transition-all" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Alamat Lengkap</label>
            <textarea 
              value={store.address} 
              onChange={(e) => setStore({ ...store, address: e.target.value })} 
              rows={2} 
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg border border-surface-container focus:ring-2 focus:ring-primary outline-none resize-none text-sm transition-all" 
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm">
              Simpan Profil
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: QRIS */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container">
        <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4 border-b border-surface-container pb-2">
          <span className="material-symbols-outlined text-primary">qr_code_2</span>
          Gambar QRIS Toko
        </h2>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Preview Area */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-surface-container-low rounded-xl p-4 aspect-square border-2 border-dashed border-surface-container-high">
            {store.qris_image_url ? (
              <img src={store.qris_image_url} alt="QRIS Toko" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-secondary">
                <span className="material-symbols-outlined text-4xl mb-2">image</span>
                <p className="text-xs">Belum ada QRIS</p>
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Upload Gambar Baru</label>
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={(e) => setQrisFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" 
              />
              <p className="text-[11px] text-secondary mt-2">Format: JPG, PNG (Max 2MB). Pastikan QRIS dari m-banking Anda terlihat jelas.</p>
            </div>
            <button 
              onClick={handleUploadQris}
              disabled={qrisLoading || !qrisFile}
              className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              {qrisLoading ? 'Mengunggah...' : 'Unggah QRIS'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: GANTI PIN ADMIN */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container">
        <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4 border-b border-surface-container pb-2">
          <span className="material-symbols-outlined text-primary">lock_reset</span>
          Ganti PIN Admin (Kasir)
        </h2>
        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs mb-4 flex gap-2 border border-amber-200">
           <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
           Mengganti PIN akan memaksa semua perangkat kasir yang sedang aktif untuk logout dan login ulang.
        </div>
        <form onSubmit={handleChangePin} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">PIN Baru (6 Angka)</label>
            <input 
              type="password" 
              maxLength={6}
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} 
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg border border-surface-container focus:ring-2 focus:ring-primary outline-none font-mono text-lg tracking-widest transition-all" 
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Konfirmasi PIN Baru</label>
            <input 
              type="password" 
              maxLength={6}
              value={confirmPin} 
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg border border-surface-container focus:ring-2 focus:ring-primary outline-none font-mono text-lg tracking-widest transition-all" 
              placeholder="••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={pinLoading}
            className="w-full bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors mt-2 shadow-sm"
          >
            {pinLoading ? 'Memproses...' : 'Perbarui PIN Kasir'}
          </button>
        </form>
      </div>
    </div>
  );
}