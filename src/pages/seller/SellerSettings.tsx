import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SellerSettings() {
  const { user } = useAuthStore();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      if (!user?.uid) return;
      try {
        const storeRef = doc(db, 'stores', user.uid);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          setStoreName(storeSnap.data().storeName || '');
          setDescription(storeSnap.data().description || '');
          setBankName(storeSnap.data().bankName || '');
          setBankAccountNumber(storeSnap.data().bankAccountNumber || '');
        }
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStore();
  }, [user?.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setIsSaving(true);
    setMessage('');

    try {
      const storeRef = doc(db, 'stores', user.uid);
      await setDoc(storeRef, {
        storeName,
        description,
        bankName,
        bankAccountNumber,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setMessage('Pengaturan toko berhasil disimpan.');
      
      // Auto clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving store settings:', error);
      setMessage('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto md:mx-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pengaturan Toko</h1>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Toko</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Rekening Pembayaran</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening & Nama Pemilik</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Contoh: 123456789 a.n John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#0D47A1] text-white font-medium rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
