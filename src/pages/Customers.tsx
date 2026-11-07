import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

interface Transaction {
  id: string;
  invoice_no: string;
  total: number;
  created_at: string;
  status: string;
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Modal Detail Pelanggan
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    apiFetch<{ data: Customer[] }>('/api/customers')
      .then((res) => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Fungsi melihat riwayat belanja
  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingHistory(true);
    try {
      const res = await apiFetch<{ data: { transactions: Transaction[] } }>(`/api/customers/${customer.id}`);
      setHistory(res.data.transactions || []);
    } catch (err) {
      alert('Gagal memuat riwayat pelanggan');
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  if (loading) return <div className="text-center mt-10">Memuat data pelanggan...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Database Pelanggan</h1>
          <p className="text-sm text-secondary">Daftar pelanggan Batam Seken</p>
        </div>
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Cari nama atau no. HP..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">No. HP</th>
                <th className="py-3 px-4">Alamat</th>
                <th className="py-3 px-4">Terdaftar Sejak</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">Belum ada data pelanggan.</td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-4 font-semibold text-on-surface">{c.name}</td>
                    <td className="py-3 px-4 text-secondary font-mono">{c.phone}</td>
                    <td className="py-3 px-4 text-secondary truncate max-w-[250px]">{c.address}</td>
                    <td className="py-3 px-4 text-secondary">
                      {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => handleViewHistory(c)} 
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        Lihat Riwayat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RIWAYAT PELANGGAN */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-surface-container flex justify-between items-center bg-surface-container-low">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Riwayat Belanja: {selectedCustomer.name}</h2>
                <p className="text-xs text-secondary">{selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-secondary hover:text-error bg-surface-container-lowest p-1 rounded-md">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="text-center py-10 text-secondary">Memuat riwayat...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 text-secondary">Pelanggan ini belum pernah bertransaksi.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-secondary text-[11px] uppercase border-b border-surface-container">
                      <th className="py-2 px-2">No. Faktur</th>
                      <th className="py-2 px-2">Tanggal</th>
                      <th className="py-2 px-2 text-right">Total</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {history.map((trx) => (
                      <tr key={trx.id}>
                        <td className="py-3 px-2 font-mono font-medium">{trx.invoice_no}</td>
                        <td className="py-3 px-2 text-secondary">
                          {new Date(trx.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-primary">{formatRupiah(Number(trx.total))}</td>
                        <td className="py-3 px-2 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              trx.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 
                              trx.status === 'VOID' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                           }`}>
                            {trx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}