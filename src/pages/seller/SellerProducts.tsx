import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Edit2, PackageOpen, Image as ImageIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';

export default function SellerProducts() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', description: '', category: 'Oleh-oleh', image: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(t => ({ id: t.id, ...t.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const productData = {
        name: formData.name,
        price: typeof formData.price === 'string' ? Number(formData.price.replace(/\./g, '')) : formData.price,
        stock: Number(formData.stock),
        description: formData.description,
        category: formData.category,
        image: formData.image, // we can use 'image' or 'images', sticking to singular for simple UI
        images: formData.image ? [formData.image] : [],
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ownerId: user.uid,
          storeId: user.uid,
          status: 'active',
          createdAt: serverTimestamp(),
          ...productData
        });
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ name: '', price: '', stock: '', description: '', category: 'Oleh-oleh', image: '' });
    } catch (e) {
       handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleEdit = (p: any) => {
    setFormData({
      name: p.name,
      price: p.price.toString(),
      stock: p.stock.toString(),
      description: p.description || '',
      category: p.category || 'Oleh-oleh',
      image: p.image || (p.images?.[0] || '')
    });
    setEditingId(p.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 600;

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
        setFormData({ ...formData, image: dataUrl });
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-900">Produk Saya</h1>
         <Button onClick={() => {
           setEditingId(null);
           setFormData({ name: '', price: '', stock: '', description: '', category: 'Oleh-oleh', image: '' });
           setIsFormOpen(!isFormOpen);
         }}><Plus className="w-5 h-5 mr-2" /> Tambah Produk</Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          
          <div className="flex items-start gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 flex-shrink-0 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden group relative"
            >
              {formData.image ? (
                <>
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">Ubah Foto</div>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 font-medium">Pilih Foto</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input label="Nama Produk" required value={formData.name} onChange={e => {
                  let val = e.target.value;
                  val = val.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  setFormData({...formData, name: val});
               }} />
               <Input label="Kategori" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
               <Input type="text" inputMode="numeric" label="Harga (Rp)" required value={formData.price} onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val) {
                    val = parseInt(val, 10).toLocaleString('id-ID');
                  }
                  setFormData({...formData, price: val});
               }} />
               <Input type="number" label="Stok" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea required className="w-full h-24 rounded-xl border border-gray-300 p-3 text-sm focus-visible:outline-none focus:ring-2 focus:ring-[#0D47A1]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
            <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Simpan Produk'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
           <PackageOpen className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
           <p className="text-gray-500">Belum ada produk. Tambahkan produk pertama Anda!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-20">Foto</th>
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Stok</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {p.image || (p.images && p.images[0]) ? (
                        <img src={p.image || p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4">{p.category}</td>
                    <td className="px-6 py-4 text-[#F4B400] font-semibold">{formatRupiah(p.price)}</td>
                    <td className="px-6 py-4">{p.stock}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <button onClick={() => handleEdit(p)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                       <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
