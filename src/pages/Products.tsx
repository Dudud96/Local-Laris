import { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, useSearchParams } from 'react-router-dom';
import { formatRupiah } from '../lib/utils';
import { Store, Tag } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name?.toLowerCase().includes(searchQuery));
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produk UMKM Brebes</h1>
          <p className="text-gray-500 mt-2">
            {searchQuery ? `Hasil pencarian untuk "${searchParams.get('q')}"` : 'Dukung produk lokal dengan berbelanja di Local Laris'}
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
         {['Semua'].map((cat, i) => (
           <button key={i} className={`whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-colors ${i === 0 ? 'bg-[#0D47A1] text-white border-[#0D47A1]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
             {cat}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="w-full aspect-square bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0D47A1]">
            <Store className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Produk</h3>
          <p className="text-gray-500">Toko UMKM di Brebes belum mengunggah produk. Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col hover:-translate-y-1">
              <div className="w-full aspect-square bg-[#F5F7FA] overflow-hidden relative">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                {product.category && (
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 rounded-full text-xs font-bold text-[#0D47A1] shadow-sm">
                    {product.category}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                <p className="text-xs font-medium text-gray-400 mb-4 line-clamp-1">{product.storeName || 'Toko UMKM'}</p>
                <div className="mt-auto flex justify-between items-center">
                  <div className="text-lg font-bold text-[#0D47A1] flex items-center gap-2">
                    {formatRupiah(product.price)}
                    <span className="text-[10px] text-gray-400 font-normal line-through">{formatRupiah(product.price * 1.2)}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#0D47A1] group-hover:bg-[#F4B400] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
