import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatRupiah } from '../lib/utils';
import { Store, ShoppingCart, Minus, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchProduct() {
      try {
        if (!id) return;
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
         handleFirestoreError(error, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!product) return <div className="p-10 text-center">Produk tidak ditemukan</div>;

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addItem({
      productId: product.id,
      storeId: product.storeId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.images?.[0]
    });
    setShowSuccessModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 relative">
          <div className="bg-gray-100 aspect-square md:aspect-auto md:h-full relative min-h-[300px]">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image Available</div>
            )}
          </div>
          <div className="p-6 md:p-10 lg:p-12 flex flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-[#0D47A1] font-semibold mb-3">
                <Store className="w-4 h-4" />
                <span>{product.storeName || 'Toko UMKM'}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-500 mb-6">Terjual 0 • Kategori: {product.category}</p>
              
              <div className="text-4xl font-extrabold text-[#F4B400] mb-8">
                {formatRupiah(product.price)}
              </div>

              <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi Produk</h3>
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
               <div className="flex items-center gap-4">
                 <span className="text-sm font-medium text-gray-700">Jumlah</span>
                 <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
                    <input type="number" readOnly value={quantity} className="w-12 h-10 text-center text-sm font-semibold border-x border-gray-200 outline-none" />
                    <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                 </div>
                 <span className="text-sm text-gray-500">Stok: {product.stock}</span>
               </div>
               
               <div className="flex gap-3 pt-2">
                  <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" /> Masukkan Keranjang
                  </Button>
               </div>
               <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-500 mt-4">
                  <ShieldCheck className="w-4 h-4 text-[#0D47A1]" />
                  <span>Transaksi aman diverifikasi Local Laris admin</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center shadow-xl">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                <ShoppingCart className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">Berhasil Ditambahkan!</h3>
             <p className="text-gray-500 mb-6">Barang telah masuk ke keranjang belanja Anda.</p>
             <div className="flex flex-col gap-3">
               <Button onClick={() => navigate('/cart')} className="w-full">
                 Checkout Sekarang
               </Button>
               <Button variant="outline" onClick={() => navigate('/products')} className="w-full">
                 Lanjutkan Belanja
               </Button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
