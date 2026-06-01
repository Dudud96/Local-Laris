import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Store, MapPin, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesRef = collection(db, 'stores');
        // Optionally you could filter by status == "approved" if needed
        const querySnapshot = await getDocs(storesRef);
        
        const storesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStores(storesData);
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Daftar UMKM Brebes</h1>
        <p className="mt-4 text-lg text-gray-500">
          Dukung pertumbuhan ekonomi lokal dengan berbelanja langsung dari para pelaku UMKM di Kabupaten Brebes.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D47A1]"></div>
        </div>
      ) : stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-6 flex-grow">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Store className="h-8 w-8 text-[#0D47A1]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{store.storeName || store.name || 'UMKM Tanpa Nama'}</h3>
                
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="h-4 w-4 flex-shrink-0 mr-1 pb-0.5" />
                  <span className="line-clamp-2">{store.address || 'Alamat tidak tersedia'}</span>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="inline-flex items-center text-sm font-medium text-[#0D47A1]">
                    Jelajahi Produk
                  </span>
                  <Link 
                    to="/products" 
                    className="inline-flex items-center justify-center p-2 bg-[#0D47A1] text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <Package className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum ada UMKM</h3>
          <p className="text-gray-500 mt-2">Daftar UMKM akan segera hadir.</p>
        </div>
      )}
    </div>
  );
}
