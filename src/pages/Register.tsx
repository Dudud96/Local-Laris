import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Store, UserPlus } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export default function Register() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm();
  
  const role = watch('role', 'buyer');

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      return setError('Password tidak cocok');
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;
      
      const userData = {
        name: data.name,
        email: data.email,
        role: role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'users', uid), userData);
        
        // If registering as seller, create a pending store record
        if (role === 'seller') {
          const storeRef = doc(db, 'stores', uid); // Use UID as storeId for simplicity
          await setDoc(storeRef, {
            ownerId: uid,
            storeName: data.storeName || `${data.name} Store`,
            description: '',
            status: 'pending',
            isVerified: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'users');
      }

      if (role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Local Laris" className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Daftar Akun Baru</h2>
          <p className="text-gray-500 mt-1">Bergabung dengan platform kami</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Nama Lengkap" 
            placeholder="Budi Santoso" 
            required 
            {...register('name')}
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="nama@email.com" 
            required 
            {...register('email')}
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tipe Akun</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${role === 'buyer' ? 'border-[#0D47A1] bg-blue-50 text-[#0D47A1]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" value="buyer" className="sr-only" {...register('role')} />
                <span className="font-semibold text-sm">Pembeli</span>
              </label>
              <label className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${role === 'seller' ? 'border-[#0D47A1] bg-blue-50 text-[#0D47A1]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" value="seller" className="sr-only" {...register('role')} />
                <span className="font-semibold text-sm">Toko UMKM</span>
              </label>
            </div>
          </div>

          {role === 'seller' && (
            <Input 
              label="Nama Toko" 
              placeholder="Toko Telur Asin Jaya" 
              required 
              {...register('storeName')}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              required 
              {...register('password')}
            />
            <Input 
              label="Konfirmasi Password" 
              type="password" 
              placeholder="••••••••" 
              required 
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
            <UserPlus className="w-5 h-5 mr-2" /> Daftar Sekarang
          </Button>
        </form>

        <p className="text-center mt-8 text-gray-600 text-sm">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-[#0D47A1] hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
