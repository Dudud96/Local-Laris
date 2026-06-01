import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer, getAggregateFromServer, sum, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch Orders manually to avoid composite index requirement and calculate accurately
        const ordersRef = collection(db, 'orders');
        const qOrdersBase = query(ordersRef, where('sellerId', '==', user.uid));
        
        const orderSnap = await getDocs(qOrdersBase);
        
        let revenue = 0;
        let newOrders = 0;
        
        orderSnap.docs.forEach(doc => {
          const data = doc.data();
          // Count revenue for valid completed/paid states
          if (['lunas', 'diproses', 'dikirim', 'selesai'].includes(data.status)) {
            const amount = Number(data.totalAmount) || 0;
            const shipping = Number(data.shippingCost) || 0;
            revenue += Math.max(0, amount - shipping);
          }
          
          // Count new orders requiring attention
          if (['menunggu_verifikasi', 'menunggu_pembayaran'].includes(data.status)) {
            newOrders++;
          }
        });
        
        setTotalRevenue(revenue);
        setNewOrdersCount(newOrders);
        
        // Fetch Products count
        const prodsRef = collection(db, 'products');
        const qProds = query(prodsRef, where('ownerId', '==', user.uid));
        const prodsSnap = await getCountFromServer(qProds);
        
        setTotalProducts(prodsSnap.data().count);
        
      } catch (error) {
        handleFirestoreError(error, OperationType.READ, 'Dashboard Stats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Toko</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Pendapatan</p>
          <p className="text-2xl font-bold text-[#F4B400]">{loading ? '...' : formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Pesanan Baru</p>
          <p className="text-2xl font-bold text-[#0D47A1]">{loading ? '...' : newOrdersCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Produk</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalProducts}</p>
        </div>
      </div>
    </div>
  );
}

