import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer, getAggregateFromServer, sum, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatRupiah } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';

export default function AdminDashboard() {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [registeredSellers, setRegisteredSellers] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);

        const ordersRef = collection(db, 'orders');

        // Fetch all orders to avoid missing complex queries and correctly handle calculations
        const ordersSnap = await getDocs(ordersRef);
        
        setTotalTransactions(ordersSnap.docs.length);

        let revenue = 0;
        let pending = 0;

        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (['lunas', 'diproses', 'dikirim', 'selesai'].includes(data.status)) {
            const amount = Number(data.totalAmount) || 0;
            const shipping = Number(data.shippingCost) || 0;
            // Admin aggregates all platform revenue correctly based on order price without shipping
            revenue += Math.max(0, amount - shipping);
          }
          if (data.status === 'menunggu_verifikasi') {
            pending++;
          }
        });
        
        setPlatformRevenue(revenue);
        setPendingVerifications(pending);

        // Fetch Sellers count (1 read)
        const usersRef = collection(db, 'users');
        const qSellers = query(usersRef, where('role', '==', 'seller'));
        const sellersSnap = await getCountFromServer(qSellers);
        setRegisteredSellers(sellersSnap.data().count);
        
      } catch (error) {
        handleFirestoreError(error, OperationType.READ, 'Admin Stats');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">UMKM Terdaftar</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : registeredSellers}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Menunggu Validasi</p>
          <p className="text-2xl font-bold text-orange-600">{loading ? '...' : pendingVerifications}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Volume Transaksi</p>
          <p className="text-2xl font-bold text-green-600">{loading ? '...' : formatRupiah(platformRevenue)}</p>
        </div>
      </div>
    </div>
  );
}
