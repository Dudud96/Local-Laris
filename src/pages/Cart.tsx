import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { formatRupiah } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 mb-8">Yuk mulai belanja produk asli unggulan Brebes sekarang!</p>
        <Link to="/products">
          <Button size="lg" className="bg-[#0D47A1]">Mulai Belanja</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Keranjang Belanja</h1>
        {items.map((item) => (
          <div key={item.productId} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
               {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <div className="text-[#F4B400] font-bold mt-1">{formatRupiah(item.price)}</div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                  <input type="number" readOnly value={item.quantity} className="w-10 h-8 bg-transparent text-center text-sm font-semibold border-x border-gray-200 outline-none" />
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
               </div>
               <button onClick={() => removeItem(item.productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
          <h3 className="font-bold text-gray-900 mb-6 text-lg">Ringkasan Belanja</h3>
          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Total Harga ({items.length} Barang)</span>
              <span>{formatRupiah(getTotal())}</span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 mb-6">
             <div className="flex justify-between items-center">
               <span className="font-bold text-gray-900">Total Tagihan</span>
               <span className="font-bold text-xl text-[#0D47A1]">{formatRupiah(getTotal())}</span>
             </div>
          </div>
          <Button size="lg" className="w-full" onClick={() => navigate('/checkout')}>
            Lanjut ke Pembayaran
          </Button>
        </div>
      </div>
    </div>
  );
}
