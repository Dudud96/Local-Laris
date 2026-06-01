import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, Truck, Store, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { formatRupiah } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [newestStores, setNewestStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [pageMarkers, setPageMarkers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchProducts();
    fetchNewestStores();
  }, []);

  const fetchNewestStores = async () => {
    try {
      // By default just query limit 4 for demo since we dont have updated timestamp on stores in this schema yet
      const q = query(collection(db, 'stores'), limit(4));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNewestStores(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStores(false);
    }
  };

  const fetchProducts = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setLoading(true);
    try {
      let q;
      const productsRef = collection(db, 'products');

      if (direction === 'initial') {
        q = query(productsRef, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
      } else if (direction === 'next' && lastVisible) {
        q = query(productsRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      } else if (direction === 'prev' && currentPage > 2) {
        // Find the marker for the *previous* page to start after.
        // If we are on page 3 and going to page 2, we want to start after the end of page 1.
        const prevMarker = pageMarkers[currentPage - 3];
        q = query(productsRef, orderBy('createdAt', 'desc'), startAfter(prevMarker), limit(ITEMS_PER_PAGE));
      } else if (direction === 'prev' && currentPage === 2) {
        // Going to page 1
        q = query(productsRef, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
      } else {
        return;
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;

      if (docs.length > 0) {
        // Fetch store info for the products
        const productsData = await Promise.all(docs.map(async (docSnap) => {
          const data = docSnap.data() as any;
          let storeName = 'Toko UMKM';
          if (data.storeId) {
             const storeDoc = await getDoc(doc(db, 'stores', data.storeId));
             if (storeDoc.exists()) {
               storeName = storeDoc.data().storeName || 'Toko UMKM';
             }
          }
          return { id: docSnap.id, ...data, storeName };
        }));

        setProducts(productsData);
        setFirstVisible(docs[0]);
        setLastVisible(docs[docs.length - 1]);
        
        if (direction === 'initial') {
          setPageMarkers([docs[docs.length - 1]]);
        } else if (direction === 'next') {
          setPageMarkers(prev => {
             const newMarkers = [...prev];
             newMarkers[currentPage] = docs[docs.length - 1];
             return newMarkers;
          });
        }
        
        // Next availability check: if we got exactly the limit, there *might* be more
        setHasMore(docs.length === ITEMS_PER_PAGE);
      } else {
        if (direction === 'initial') {
          setProducts([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchProducts('next');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchProducts('prev');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero & Featured Store Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Banner */}
        <div className="lg:col-span-8 h-64 md:h-48 rounded-3xl bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#1e88e5] relative overflow-hidden shadow-lg p-8 flex flex-col justify-center text-white">
          <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-white opacity-5 rounded-full"></div>
          <div className="absolute right-10 bottom-0 w-48 h-40 bg-[rgba(255,255,255,0.1)] rounded-t-3xl backdrop-blur-md"></div>
          <h1 className="text-4xl font-bold mb-2">Local Laris</h1>
          <p className="text-xl font-light opacity-90 mb-6 md:mb-4">Beli Lokal, Dukung UMKM Brebes</p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto relative z-10">
            <Link className="inline-block" to="/products">
              <Button className="w-full sm:w-auto bg-[#F4B400] text-[#0D47A1] font-bold px-6 py-2 rounded-full shadow-md text-sm hover:bg-yellow-500">
                Belanja Sekarang
              </Button>
            </Link>
            <Link className="inline-block" to="/register">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent border border-white px-6 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 hover:text-white">
                Buka Toko Gratis
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Newest Stores */}
        <div className="lg:col-span-4 md:h-48 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0D47A1] mb-4 flex items-center justify-between">
            Toko UMKM Terbaru
            <Link to="/stores" className="text-xs text-gray-500 hover:text-[#0D47A1] lowercase">lihat semua</Link>
          </h3>
          {loadingStores ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center space-x-3 p-2 bg-[#F5F7FA] rounded-xl animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : newestStores.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {newestStores.map((store) => (
                <Link key={store.id} to="/products" className="flex items-center space-x-3 p-2 bg-[#F5F7FA] rounded-xl cursor-pointer hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-[#0D47A1] shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 line-clamp-1 break-all">
                    {store.storeName || store.name || 'Toko UMKM'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 py-4">
               <Store className="w-6 h-6 mb-2" />
               <span className="text-xs">Belum ada toko</span>
             </div>
          )}
        </div>
      </div>

      {/* List Products */}
      <div>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <span className="w-1.5 h-6 bg-[#F4B400] rounded-full mr-3"></span>
            Semua Produk
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5].map(i => (
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
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0D47A1]">
              <Store className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Produk</h3>
            <p className="text-gray-500">Toko UMKM di Brebes belum mengunggah produk. Jadilah yang pertama!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col hover:-translate-y-1">
                  <div className="w-full aspect-square bg-[#F5F7FA] overflow-hidden relative">
                    {product.image || (product.images && product.images[0]) ? (
                      <img src={product.image || product.images[0]} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <p className="text-xs font-medium text-gray-400 mb-4 line-clamp-1">{product.storeName}</p>
                    <div className="mt-auto flex justify-between items-center">
                      <div className="text-lg font-bold text-[#0D47A1] flex items-center gap-2">
                        {formatRupiah(product.price)}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#0D47A1] group-hover:bg-[#F4B400] group-hover:text-white transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {(currentPage > 1 || hasMore) && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="rounded-full shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Sebelumnya
                </Button>
                <span className="text-sm font-medium text-gray-600">Halaman {currentPage}</span>
                <Button 
                  onClick={handleNextPage} 
                  disabled={!hasMore}
                  className="rounded-full shadow-sm bg-[#0D47A1] hover:bg-[#1565C0]"
                >
                  Selanjutnya <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom UI Elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-16 h-16 bg-[#F5F7FA] rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-8 h-8 text-[#0D47A1]" />
          </div>
          <div>
            <h4 className="font-bold text-[#0D47A1]">Transaksi Aman & Terverifikasi</h4>
            <p className="text-xs text-gray-500 mt-1">Dikelola langsung oleh admin Local Laris untuk keamanan UMKM dan pembeli.</p>
          </div>
        </div>
        <div className="bg-[#0D47A1] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between text-white space-y-4 md:space-y-0">
          <div>
            <h4 className="font-bold">Punya Produk UMKM Brebes?</h4>
            <p className="text-xs opacity-80 mt-1">Ayo bergabung dengan 245+ mitra lainnya.</p>
          </div>
          <Link to="/register">
            <button className="bg-[#F4B400] text-[#0D47A1] font-bold px-5 py-2 rounded-xl text-sm hover:bg-yellow-500 transition-colors">Mulai Berjualan</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
