import Swal from 'sweetalert2';

// Tampilan sukses
export const showSuccess = (title: string, text: string = '') => {
  Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#006948', // Warna primary kamu
    timer: 2000,
    showConfirmButton: false,
  });
};

// Tampilan error / gagal
export const showError = (title: string, text: string = '') => {
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ba1a1a',
  });
};

// Tampilan konfirmasi (untuk Void, Hapus, dll)
export const showConfirm = async (title: string, text: string, confirmText: string = 'Ya, Lanjutkan') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#006948',
    cancelButtonColor: '#6d7a72',
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    reverseButtons: true
  });
  return result.isConfirmed;
};

// Tampilan input text (untuk alasan hapus)
export const showPrompt = async (title: string, placeholder: string) => {
  const { value } = await Swal.fire({
    title,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: '#006948',
    cancelButtonColor: '#6d7a72',
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    inputValidator: (value) => {
      if (!value) return 'Harus diisi!';
    }
  });
  return value;
};