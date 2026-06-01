import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, getDocs, where } from 'firebase/firestore';
import { formatRupiah } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Wallet, ShieldCheck, MapPin, ChevronRight, Home, Briefcase, Store as StoreIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import AddressManager, { Address } from './buyer/AddressManager';

export default function Checkout() {
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [storeBanks, setStoreBanks] = useState<{[key: string]: any}>({});
  
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    } else {
      const fetchStoreBanks = async () => {
        const stores = [...new Set(items.map(item => item.storeId))];
        const banks: {[key: string]: any} = {};
        for (const storeId of stores) {
          try {
            const storeSnap = await getDoc(doc(db, 'stores', storeId));
            if (storeSnap.exists()) {
              banks[storeId] = {
                bankName: storeSnap.data().bankName || 'Bank Belum Diatur',
                bankAccountNumber: storeSnap.data().bankAccountNumber || 'Hubungi Penjual',
                storeName: storeSnap.data().storeName || 'Toko'
              };
            }
          } catch (e) {
             console.error("Error fetching store bank", e);
          }
        }
        setStoreBanks(banks);
      };
      fetchStoreBanks();
      
      if (user) {
         fetchDefaultAddress();
      }
    }
  }, [items.length, items, navigate, user]);

  const fetchDefaultAddress = async () => {
     if (!user) return;
     try {
       const q = query(collection(db, 'users', user.uid, 'addresses'));
       const snap = await getDocs(q);
       const addresses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
       
       const defaultAddr = addresses.find(a => a.isDefault);
       if (defaultAddr) {
         handleSelectAddress(defaultAddr);
       } else if (addresses.length > 0) {
         handleSelectAddress(addresses[0]);
       }
     } catch(e) {}
  };

  const handleSelectAddress = (addr: Address) => {
     setSelectedAddress(addr);
     setShowAddressModal(false);
     
     // Menggunakan sistem Flat Rate (Ongkir Tetap) untuk wilayah lokal
     // Rp 15.000 per toko UMKM
     const flatRatePerStore = 15000;
     const storeCount = new Set(items.map(i => i.storeId)).size;
     setShippingCost(flatRatePerStore * storeCount);
  };

  if (items.length === 0) {
    return null;
  }

  const handleCheckout = async () => {
    if (!selectedAddress) return alert('Pilih alamat pengiriman terlebih dahulu!');
    setLoading(true);

    try {
      const stores = [...new Set(items.map(item => item.storeId))];
      // divide shipping equally or calculate per store
      const shippingPerStore = shippingCost / stores.length;

      for (const storeId of stores) {
        const storeItems = items.filter(i => i.storeId === storeId);
        const storeTotal = storeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const storeBank = storeBanks[storeId] || {};
        
        const fullAddressStr = `${selectedAddress.receiverName} (${selectedAddress.phone})\n${selectedAddress.detail}\n${selectedAddress.subdistrict}, ${selectedAddress.district}, ${selectedAddress.city}, ${selectedAddress.province} ${selectedAddress.postalCode}\nCatatan: ${selectedAddress.note || '-'}`;

        await addDoc(collection(db, 'orders'), {
          buyerId: user?.uid,
          sellerId: storeId,
          status: 'menunggu_pembayaran',
          items: storeItems,
          totalAmount: storeTotal + shippingPerStore,
          shippingCost: shippingPerStore,
          shippingAddress: fullAddressStr,
          bankName: storeBank.bankName || '',
          bankAccountNumber: storeBank.bankAccountNumber || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      clearCart();
      alert('Pesanan berhasil dibuat! Silakan upload bukti pembayaran di halaman pesanan.');
      navigate('/buyer/orders');

    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const storeIds = [...new Set(items.map(item => item.storeId))];
  const itemsTotal = getTotal();

  const getLabelIcon = (label: string) => {
      if (label === 'Rumah') return <Home className="w-4 h-4" />;
      if (label === 'Kantor') return <Briefcase className="w-4 h-4" />;
      if (label === 'Toko') return <StoreIcon className="w-4 h-4" />;
      return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pembayaran</h1>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
             <MapPin className="text-[#0D47A1] w-5 h-5"/>
             <h3 className="font-bold text-gray-900 text-lg">Alamat Pengiriman</h3>
           </div>
           {selectedAddress && (
             <button onClick={() => setShowAddressModal(true)} className="text-sm font-semibold text-[#0D47A1] hover:text-blue-800">
               Pilih Alamat Lain
             </button>
           )}
        </div>
        
        {selectedAddress ? (
            <div className="p-4 rounded-xl border border-[#0D47A1] bg-blue-50/30">
               <div className="flex items-center gap-2 mb-2">
                 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold bg-[#0D47A1] text-white">
                    {getLabelIcon(selectedAddress.label)} {selectedAddress.label}
                 </span>
                 {selectedAddress.isDefault && <span className="text-[10px] font-bold text-[#0D47A1]">Utama</span>}
               </div>
               <p className="font-bold text-gray-900">{selectedAddress.receiverName} <span className="font-normal text-gray-500 text-sm ml-2">{selectedAddress.phone}</span></p>
               <p className="text-sm text-gray-600 mt-1">{selectedAddress.detail}</p>
               <p className="text-sm text-gray-600 uppercase">{selectedAddress.subdistrict}, {selectedAddress.district}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}</p>
            </div>
        ) : (
             <Button variant="outline" className="w-full flex items-center justify-between" onClick={() => setShowAddressModal(true)}>
                <span>Pilih atau Tambah Alamat Pengiriman</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
             </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
         <div className="flex items-center gap-2 mb-4">
          <Wallet className="text-[#0D47A1] w-5 h-5"/>
          <h3 className="font-bold text-gray-900 text-lg">Metode Pembayaran (Transfer Bank Manual)</h3>
        </div>
        
        <div className="space-y-3">
          {storeIds.map(storeId => {
            const bank = storeBanks[storeId];
            if (!bank) return null;
            return (
              <div key={storeId} className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                 <p className="text-sm font-semibold text-gray-700 mb-1">Transfer ke Toko: {bank.storeName}</p>
                 <p className="text-sm text-[#0D47A1] mb-2 font-medium">{bank.bankName}</p>
                 <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">{bank.bankAccountNumber}</p>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-100">
           <h3 className="font-bold text-gray-900 text-lg mb-4">Ringkasan Pesanan</h3>
           <div className="space-y-4 mb-6">
             {items.map((item, index) => (
               <div key={index} className="flex gap-4 items-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                   {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"/>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">
                       <MapPin className="w-6 h-6 opacity-0"/>
                     </div> // fallback
                   )}
                 </div>
                 <div className="flex-1">
                   <p className="font-semibold text-gray-900 text-sm line-clamp-2">{item.name}</p>
                   <p className="text-gray-500 text-sm">{item.quantity} x {formatRupiah(item.price)}</p>
                 </div>
                 <p className="font-semibold text-gray-900">{formatRupiah(item.price * item.quantity)}</p>
               </div>
             ))}
           </div>
           
           <div className="space-y-2 mb-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Harga Barang ({items.length} Barang)</span>
                <span>{formatRupiah(itemsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Ongkos Kirim {shippingCost > 0 ? '' : '(Pilih Alamat)'}</span>
                <span>{shippingCost > 0 ? formatRupiah(shippingCost) : '-'}</span>
              </div>
           </div>

           <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
             <span className="font-semibold text-gray-900">Total Tagihan</span>
             <span className="text-2xl font-extrabold text-[#F4B400]">{formatRupiah(itemsTotal + shippingCost)}</span>
           </div>
           
           <Button size="lg" className="w-full" onClick={handleCheckout} isLoading={loading} disabled={!selectedAddress}>
              Konfirmasi Pesanan
           </Button>
           <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-400">
             <ShieldCheck className="w-4 h-4"/>
             <span>Pembayaran dikirim langsung ke rekening toko.</span>
           </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center items-center bg-black/50 p-0 sm:p-4 pb-0 sm:pb-4 animation-fade-in">
           <div className="w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h2 className="text-xl font-bold text-gray-900">Pilih Alamat Pengiriman</h2>
                 <button onClick={() => setShowAddressModal(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                 <AddressManager onSelectAddress={handleSelectAddress} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
