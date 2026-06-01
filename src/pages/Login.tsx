import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Store, LogIn } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // Determine redirect based on role
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'seller') navigate('/seller');
        else navigate('/');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Local Laris" className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
          <p className="text-gray-500 mt-1">Masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input 
            label="Email" 
            type="email" 
            placeholder="nama@email.com" 
            required 
            {...register('email')}
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            required 
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-[#0D47A1] hover:underline">
              Lupa password?
            </Link>
          </div>
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            <LogIn className="w-5 h-5 mr-2" /> Main Masuk
          </Button>
        </form>

        <p className="text-center mt-8 text-gray-600 text-sm">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-[#0D47A1] hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
