import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, Store as StoreIcon, MoreHorizontal } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';

export interface Address {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  detail: string;
  note: string;
  isDefault: boolean;
}

const PREDEFINED_LABELS = ['Rumah', 'Kantor', 'Kos', 'Toko'];

const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export default function AddressManager({ onSelectAddress }: { onSelectAddress?: (addr: Address) => void }) {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Address>>({
    label: 'Rumah',
    receiverName: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    subdistrict: '',
    postalCode: '',
    detail: '',
    note: '',
    isDefault: false
  });
  const [customLabel, setCustomLabel] = useState('');

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'addresses'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
      // Sort default first
      data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      setAddresses(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let finalLabel = formData.label;
      if (finalLabel === 'Lainnya') {
        finalLabel = customLabel || 'Lainnya';
      }

      const addressData = {
        ...formData,
        label: finalLabel,
      };

      const addressesRef = collection(db, 'users', user.uid, 'addresses');

      if (addressData.isDefault) {
        // Find existing default and set to false
        const batch = writeBatch(db);
        const defaultAddrs = addresses.filter(a => a.isDefault && a.id !== editingId);
        for (const addr of defaultAddrs) {
          batch.update(doc(db, 'users', user.uid, 'addresses', addr.id), { isDefault: false });
        }
        await batch.commit();
      } else if (addresses.length === 0 && !editingId) {
        // First address is always default
        addressData.isDefault = true;
      }

      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'addresses', editingId), addressData);
      } else {
        await addDoc(addressesRef, addressData);
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchAddresses();
    } catch (error) {
      if (editingId) {
        handleFirestoreError(error, OperationType.UPDATE, 'addresses');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'addresses');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Yakin ingin menghapus alamat ini?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', id));
      fetchAddresses();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'addresses');
    }
  };

  const openEdit = (addr: Address) => {
    const isPredefined = PREDEFINED_LABELS.includes(addr.label);
    setFormData({
      ...addr,
      label: isPredefined ? addr.label : 'Lainnya'
    });
    if (!isPredefined) {
      setCustomLabel(addr.label);
    }
    setEditingId(addr.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      label: 'Rumah',
      receiverName: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      subdistrict: '',
      postalCode: '',
      detail: '',
      note: '',
      isDefault: false
    });
    setCustomLabel('');
  };

  const setAsDefault = async (id: string) => {
      if (!user) return;
      try {
        const batch = writeBatch(db);
        // Set all to false
        for (const addr of addresses) {
            batch.update(doc(db, 'users', user.uid, 'addresses', addr.id), { isDefault: addr.id === id });
        }
        await batch.commit();
        fetchAddresses();
      } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, 'addresses');
      }
  };

  const getLabelIcon = (label: string) => {
      if (label === 'Rumah') return <Home className="w-4 h-4" />;
      if (label === 'Kantor') return <Briefcase className="w-4 h-4" />;
      if (label === 'Toko') return <StoreIcon className="w-4 h-4" />;
      return <MapPin className="w-4 h-4" />;
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
           <MapPin className="text-[#0D47A1] w-5 h-5"/>
           Daftar Alamat
        </h3>
        <Button onClick={() => { resetForm(); setShowModal(true); }} size="sm" variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Alamat
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Belum ada alamat tersimpan.</p>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            Tambah Alamat Baru
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`p-4 rounded-xl border transition-all ${addr.isDefault ? 'border-[#0D47A1] bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${addr.isDefault ? 'bg-[#0D47A1] text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {getLabelIcon(addr.label)} {addr.label}
                  </span>
                  {addr.isDefault && <span className="text-xs font-bold text-[#0D47A1]">Utama</span>}
                </div>
                {!onSelectAddress && (
                    <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(addr)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    {!addr.isDefault && (
                        <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    </div>
                )}
              </div>
              <div className="space-y-1 mb-4" onClick={() => onSelectAddress && onSelectAddress(addr)} style={{ cursor: onSelectAddress ? 'pointer' : 'default' }}>
                <p className="font-bold text-gray-900">{addr.receiverName} <span className="font-normal text-gray-500 text-sm ml-2">{addr.phone}</span></p>
                <p className="text-sm text-gray-600">{addr.detail}</p>
                <p className="text-sm text-gray-600 uppercase">{addr.subdistrict}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}</p>
                {addr.note && <p className="text-sm text-gray-500 mt-2 flex gap-1"><span className="font-medium">Catatan:</span> {addr.note}</p>}
              </div>

               <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  {onSelectAddress ? (
                     <Button size="sm" onClick={() => onSelectAddress(addr)} className="w-full sm:w-auto">Pilih Alamat Ini</Button>
                  ) : (
                      !addr.isDefault && (
                        <Button size="sm" variant="outline" onClick={() => setAsDefault(addr.id)}>
                            Jadikan Utama
                        </Button>
                      )
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form id="address-form" onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Kontak</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima</label>
                        <input required type="text" value={formData.receiverName} onChange={e => setFormData({...formData, receiverName: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                        <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Alamat Lengkap</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                        <input required type="text" value={formData.province} onChange={e => setFormData({...formData, province: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kota / Kabupaten</label>
                        <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                        <input required type="text" value={formData.district} onChange={e => setFormData({...formData, district: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan / Desa</label>
                        <input required type="text" value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                      </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                     <input required type="text" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Detail Alamat</label>
                     <textarea required rows={3} placeholder="Nama jalan, gedung, no. rumah, RT/RW..." value={formData.detail} onChange={e => setFormData({...formData, detail: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none resize-none"></textarea>
                  </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Catatan untuk Kurir (Opsional)</label>
                     <input type="text" placeholder="Warna rumah, patokan, dll." value={formData.note} onChange={e => setFormData({...formData, note: capitalizeWords(e.target.value)})} className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none" />
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Label Alamat</h3>
                  <div className="flex flex-wrap gap-2">
                     {['Rumah', 'Kantor', 'Kos', 'Toko', 'Lainnya'].map((lbl) => (
                         <button 
                            key={lbl} 
                            type="button"
                            onClick={() => setFormData({...formData, label: lbl})}
                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${formData.label === lbl ? 'bg-blue-50 border-[#0D47A1] text-[#0D47A1]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                         >
                            {lbl}
                         </button>
                     ))}
                  </div>
                  {formData.label === 'Lainnya' && (
                      <input type="text" placeholder="Masukkan nama label" value={customLabel} onChange={e => setCustomLabel(capitalizeWords(e.target.value))} required className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent outline-none mt-2" />
                  )}
              </div>
              <div className="flex items-center gap-2 py-2">
                 <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} className="w-4 h-4 text-[#0D47A1] rounded border-gray-300 focus:ring-[#0D47A1]" />
                 <label htmlFor="isDefault" className="text-sm text-gray-700 font-medium">Jadikan sebagai alamat utama</label>
              </div>
            </form>
            
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" form="address-form" className="flex-1">Simpan Alamat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
