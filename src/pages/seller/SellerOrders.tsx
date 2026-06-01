import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, limit, orderBy, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../lib/utils';
import { Package, CheckCircle, Image as ImageIcon, AlertCircle, X, RefreshCw } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { Button } from '../../components/ui/Button';

export default function SellerOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid), limit(50));
      const snap = await getDocs(q);
      const ordersData = snap.docs.map(t => ({ id: t.id, ...t.data() }));
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

  const handleVerifyPayment = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      // Update order status
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'lunas',
        updatedAt: serverTimestamp()
      });

      // Deduct stock for each item in the order
      if (order.items && Array.isArray(order.items)) {
        await Promise.all(order.items.map((item: any) => 
          updateDoc(doc(db, 'products', item.productId), {
            stock: increment(-item.quantity),
            updatedAt: serverTimestamp()
          }).catch(err => {
            console.error(`Failed to deduct stock for product ${item.productId}:`, err);
            // We log error but don't fail the verification since checkout might be unrecoverable
          })
        ));
      }

      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoadingOrderId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    } finally {
      setLoadingOrderId(null);
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Masuk</h1>
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
      
      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
          <p className="text-gray-500">Belum ada pesanan masuk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
               <div className="flex justify-between items-start border-b pb-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Order ID: {order.id}</div>
                    <div className="font-semibold text-gray-900">{formatRupiah(order.totalAmount)}</div>
                  </div>
                  <span className={"px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider " + (statusColors[order.status] || 'bg-gray-100 text-gray-800')}>
                    {order.status.replace('_', ' ')}
                  </span>
               </div>
               
               <div className="space-y-3 mb-6 flex-1">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between text-sm items-start sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"/>
                          ) : (
                            <ImageIcon className="w-5 h-5 mx-auto mt-2.5 text-gray-400" />
                          )}
                        </div>
                        <span className="text-gray-700 font-medium">{item.quantity}x {item.name}</span>
                      </div>
                      <span className="text-gray-500 mt-2 sm:mt-0">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
               </div>

               {/* Seller Action / Verification */}
               <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700 block mb-1">Alamat Pengiriman:</span>
                    <span className="text-gray-600 whitespace-pre-line">{order.shippingAddress}</span>
                  </div>

                  {order.status === 'menunggu_verifikasi' && order.paymentProofUrl && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="font-semibold text-gray-700 text-sm mb-2">Bukti Transfer:</p>
                      <button type="button" onClick={() => setSelectedImage(order.paymentProofUrl)} className="block mb-4 overflow-hidden rounded-lg border border-gray-200 w-full hover:opacity-90 transition-opacity">
                        <img src={order.paymentProofUrl} alt="Bukti Transfer" className="w-full h-32 object-cover" />
                      </button>
                      <div className="flex flex-col gap-2">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white" 
                          onClick={() => handleVerifyPayment(order.id)}
                          isLoading={loadingOrderId === order.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-2"/> Verifikasi & Tandai Lunas
                        </Button>
                        <Button 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          variant="outline"
                          onClick={() => setCancelOrderId(order.id)}
                          disabled={loadingOrderId === order.id}
                        >
                          Tolak / Batalkan Pesanan
                        </Button>
                      </div>
                    </div>
                  )}

                  {order.status === 'menunggu_pembayaran' && (
                    <div className="pt-4 border-t border-gray-200 text-center text-gray-500 text-sm flex flex-col items-center gap-4">
                      <span className="italic">Menunggu pembeli mengunggah bukti pembayaran.</span>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="w-full max-w-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setCancelOrderId(order.id)}
                        disabled={loadingOrderId === order.id}
                      >
                         Batalkan Pesanan
                      </Button>
                    </div>
                  )}

                  {order.status === 'dibatalkan' && (
                    <div className="pt-4 border-t border-gray-200 text-center text-red-500 text-sm italic">
                      Pesanan ini telah dibatalkan oleh pembeli.
                    </div>
                  )}

                  {order.status !== 'menunggu_pembayaran' && order.status !== 'menunggu_verifikasi' && order.status !== 'dibatalkan' && (
                    <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                      {order.status === 'lunas' && (
                        <div className="text-center">
                          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-green-700 mb-2">Pembayaran Terverifikasi</p>
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                            onClick={() => handleUpdateStatus(order.id, 'diproses')}
                            isLoading={loadingOrderId === order.id}
                          >
                            Proses Pesanan
                          </Button>
                        </div>
                      )}
                      
                      {order.status === 'diproses' && (
                        <div className="text-center">
                          <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-blue-700 mb-2">Sedang Diproses/Dikemas</p>
                          <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                            onClick={() => handleUpdateStatus(order.id, 'dikirim')}
                            isLoading={loadingOrderId === order.id}
                          >
                            Tandai Dikirim
                          </Button>
                        </div>
                      )}

                      {order.status === 'dikirim' && (
                        <div className="text-center text-indigo-600 text-sm font-semibold flex flex-col items-center justify-center gap-1">
                          <Package className="w-6 h-6 mb-1" /> 
                          Pesanan Sedang Dikirim
                          <span className="font-normal text-xs text-gray-500 block mt-1">Menunggu pembeli menyelesaikan pesanan.</span>
                        </div>
                      )}

                      {order.status === 'selesai' && (
                        <div className="text-center text-gray-700 text-sm font-semibold flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" /> Pesanan Selesai
                        </div>
                      )}
                    </div>
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
              Apakah Anda yakin ingin menolak atau membatalkan pesanan ini? Tindakan ini tidak dapat diurungkan.
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

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <button 
            type="button" 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Bukti Transfer Full" 
            className="w-full max-w-3xl max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}
    </div>
  );
}
