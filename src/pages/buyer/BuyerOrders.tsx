import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../lib/utils';
import { ShoppingBag, Upload, Clock, CheckCircle, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { Button } from '../../components/ui/Button';

export default function BuyerOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'orders'), where('buyerId', '==', user.uid), limit(50));
      const snap = await getDocs(q);
      const ordersData = await Promise.all(snap.docs.map(async (t) => {
        const data = t.data() as any;
        let bankName = data.bankName;
        let bankAccountNumber = data.bankAccountNumber;
        let storeName = data.storeName;

        // Fetch from stores collection if missing
        if ((!bankName || !bankAccountNumber) && data.sellerId) {
          try {
             const storeSnap = await getDoc(doc(db, 'stores', data.sellerId));
             if (storeSnap.exists()) {
                const storeData = storeSnap.data();
                bankName = storeData.bankName || bankName;
                bankAccountNumber = storeData.bankAccountNumber || bankAccountNumber;
                storeName = storeData.storeName || storeName;
             }
          } catch(e) { /* ignore */ }
        }

        return { 
          id: t.id, 
          ...data,
          bankName,
          bankAccountNumber,
          storeName: storeName || 'Toko'
        };
      }));
      
      // Sort so newest is first. We have createdAt but usually it's a server timestamp.
      ordersData.sort((a: any, b: any) => {
         const tA = a.createdAt?.seconds || 0;
         const tB = b.createdAt?.seconds || 0;
         return tB - tA;
      });
      setOrders(ordersData);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'orders');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleUploadPayment = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingOrderId(orderId);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 800;

        if (width > height) {
          if (width > max) {
            height *= max / width;
            width = max;
          }
        } else {
          if (height > max) {
            width *= max / height;
            height = max;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        try {
          await updateDoc(doc(db, 'orders', orderId), {
            paymentProofUrl: dataUrl,
            status: 'menunggu_verifikasi',
            updatedAt: serverTimestamp()
          });
          fetchOrders();
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, 'orders');
        } finally {
          setLoadingOrderId(null);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    
    setLoadingOrderId(cancelOrderId);
    try {
      await updateDoc(doc(db, 'orders', cancelOrderId), {
        status: 'dibatalkan',
        updatedAt: serverTimestamp()
      });
      fetchOrders();
      setCancelOrderId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleFinishOrder = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'selesai',
        updatedAt: serverTimestamp()
      });
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    } finally {
      setLoadingOrderId(null);
    }
  };

  const statusColors: any = {
    'menunggu_pembayaran': 'bg-red-100 text-red-800',
    'menunggu_verifikasi': 'bg-yellow-100 text-yellow-800',
    'lunas': 'bg-green-100 text-green-800',
    'diproses': 'bg-blue-100 text-blue-800',
    'dikirim': 'bg-indigo-100 text-indigo-800',
    'selesai': 'bg-gray-100 text-gray-800',
    'dibatalkan': 'bg-red-50 text-red-600'
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchOrders} 
          disabled={isRefreshing}
          className="bg-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Explanation of the Buyer Payment Flow as Requested */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-[#0D47A1] mb-2">Alur Pesanan & Pembayaran</h2>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-3 mt-4">
          <li><strong>Anda Melakukan Pemesanan</strong><br/><span className="text-gray-500">Pesanan dibuat saat Anda menyelesaikan checkout.</span></li>
          <li><strong>Sistem Membuat Tagihan</strong><br/><span className="text-gray-500">Pesanan masuk ke daftar ini dengan status Menunggu Pembayaran.</span></li>
          <li><strong>Upload Bukti Transfer</strong><br/><span className="text-gray-500">Setelah melakukan pembayaran, silakan upload bukti transfer. Status pesanan akan berubah menjadi Menunggu Verifikasi.</span></li>
          <li><strong>Penjual Memverifikasi Pembayaran</strong><br/><span className="text-gray-500">Penjual akan memeriksa bukti transfer dan mencocokkannya dengan pembayaran yang masuk.</span></li>
          <li><strong>Pesanan Dinyatakan Lunas</strong><br/><span className="text-gray-500">Jika pembayaran sudah dikonfirmasi, status pesanan akan berubah menjadi Lunas.</span></li>
        </ol>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
           <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
           <p className="text-gray-500">Belum ada pesanan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-6">
               <div className="flex-1">
                  <div className="flex justify-between items-start border-b pb-4 mb-4">
                     <div>
                       <div className="text-xs text-gray-500 mb-1">Order ID: {order.id}</div>
                       <div className="font-semibold text-gray-900">{formatRupiah(order.totalAmount)}</div>
                     </div>
                     <span className={"px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider " + (statusColors[order.status] || 'bg-gray-100 text-gray-800')}>
                       {order.status.replace('_', ' ')}
                     </span>
                  </div>
                  <div className="space-y-3">
                     {order.items.map((item: any, i: number) => (
                       <div key={i} className="flex flex-col sm:flex-row justify-between text-sm items-start sm:items-center">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                             {item.imageUrl ? (
                               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"/>
                             ) : (
                               <ShoppingBag className="w-5 h-5 mx-auto mt-2.5 text-gray-400" />
                             )}
                           </div>
                           <span className="text-gray-700 font-medium">{item.quantity}x {item.name}</span>
                         </div>
                         <span className="text-gray-500 mt-2 sm:mt-0">{formatRupiah(item.price * item.quantity)}</span>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Payment Form Action */}
               <div className="w-full sm:w-64 shrink-0 bg-gray-50 p-4 rounded-xl flex flex-col justify-center items-center text-center border border-gray-100">
                  {order.status === 'menunggu_pembayaran' ? (
                     <>
                        <Clock className="w-8 h-8 text-red-400 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Segera Lakukan Pembayaran</p>
                        <p className="text-xs text-gray-500 mb-2">Transfer sesuai total nominal ke rekening toko berikut dan unggah buktinya disini.</p>
                        {(order.bankName || order.bankAccountNumber) ? (
                           <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 w-full mb-4 text-left shadow-sm">
                              <p className="text-xs font-medium text-gray-500 mb-1">Penerima: <span className="font-semibold text-gray-700">{order.storeName || 'Toko'}</span></p>
                              <p className="text-sm font-bold text-[#0D47A1]">{order.bankName || 'Bank'}</p>
                              <p className="text-lg font-mono font-extrabold text-gray-900 break-all items-center flex justify-between">
                                 {order.bankAccountNumber || '-'}
                              </p>
                           </div>
                        ) : (
                           <div className="bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-100 w-full mb-4 text-left">
                              <p className="text-xs font-semibold text-yellow-800">Menunggu Informasi Rekening Toko</p>
                              <p className="text-xs text-yellow-600">Mohon hubungi penjual untuk meminta nomor rekening pembayaran.</p>
                           </div>
                        )}
                        <input 
                           type="file" 
                           accept="image/*" 
                           style={{ display: 'none' }} 
                           ref={el => fileInputRefs.current[order.id] = el}
                           onChange={(e) => handleUploadPayment(order.id, e)}
                        />
                        <Button 
                           size="sm" 
                           onClick={() => fileInputRefs.current[order.id]?.click()}
                           isLoading={loadingOrderId === order.id}
                           className="w-full mb-2"
                        >
                           <Upload className="w-4 h-4 mr-2"/> Upload Bukti
                        </Button>
                        <Button 
                           size="sm"
                           variant="outline"
                           className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                           onClick={() => setCancelOrderId(order.id)}
                           disabled={loadingOrderId === order.id}
                        >
                           Batalkan Pesanan
                        </Button>
                     </>
                  ) : order.status === 'menunggu_verifikasi' ? (
                     <>
                        <Clock className="w-8 h-8 text-yellow-400 mb-2 animate-pulse"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Sedang Diverifikasi</p>
                        <p className="text-xs text-gray-500">Penjual sedang memeriksa bukti pembayaran Anda secara manual.</p>
                     </>
                  ) : order.status === 'dibatalkan' ? (
                     <>
                        <Clock className="w-8 h-8 text-gray-400 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Pesanan Dibatalkan</p>
                        <p className="text-xs text-gray-500">Pemesanan ini batal.</p>
                     </>
                  ) : order.status === 'lunas' ? (
                     <>
                        <CheckCircle className="w-8 h-8 text-green-500 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Pembayaran Terverifikasi</p>
                        <p className="text-xs text-gray-500">Menunggu penjual memproses dan mengemas pesanan Anda.</p>
                     </>
                  ) : order.status === 'diproses' ? (
                     <>
                        <Package className="w-8 h-8 text-blue-500 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Pesanan Diproses</p>
                        <p className="text-xs text-gray-500">Penjual sedang menyiapkan pesanan Anda.</p>
                     </>
                  ) : order.status === 'dikirim' ? (
                     <>
                        <Package className="w-8 h-8 text-indigo-500 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Pesanan Dikirim</p>
                        <p className="text-xs text-gray-500 mb-4">Pesanan Anda sedang dalam perjalanan.</p>
                        <Button 
                           size="sm"
                           className="w-full bg-green-600 hover:bg-green-700 text-white"
                           onClick={() => handleFinishOrder(order.id)}
                           isLoading={loadingOrderId === order.id}
                        >
                           Selesaikan Pesanan
                        </Button>
                     </>
                  ) : order.status === 'selesai' ? (
                     <>
                        <CheckCircle className="w-8 h-8 text-gray-500 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Pesanan Selesai</p>
                        <p className="text-xs text-gray-500">Transaksi telah selesai dengan sukses.</p>
                     </>
                  ) : (
                     <>
                        <CheckCircle className="w-8 h-8 text-green-500 mb-2"/>
                        <p className="text-sm font-bold text-gray-900 mb-1">Pembayaran Selesai</p>
                        <p className="text-xs text-gray-500">Pesanan telah lunas atau sedang diproses/dikirim.</p>
                     </>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full mx-auto shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Batalkan Pesanan?</h3>
            <p className="text-gray-500 mb-8">
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setCancelOrderId(null)}
                disabled={loadingOrderId === cancelOrderId}
              >
                Kembali
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white" 
                onClick={handleCancelOrder}
                isLoading={loadingOrderId === cancelOrderId}
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
