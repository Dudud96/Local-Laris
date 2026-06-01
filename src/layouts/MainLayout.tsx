import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Store, ShoppingCart, ShoppingBag, User, LogIn, LayoutDashboard, Search, Menu } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'seller' && user?.uid) {
      getDoc(doc(db, 'stores', user.uid)).then(docSnap => {
        if (docSnap.exists()) {
          setStoreName(docSnap.data().storeName || '');
        }
      });
    }
  }, [user?.role, user?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand */}
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="Local Laris" className="h-14 w-auto md:h-16 object-contain pb-1" />
            </Link>

            {/* Desktop Search (Mock) */}
            <div className="hidden md:flex flex-1 max-w-xl px-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari telur asin, bawang merah..." 
                  className="w-full bg-[#F5F7FA] border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-[#1565C0] focus:border-transparent outline-none transition-all"
                />
                <button type="submit" className="absolute left-3 top-2.5">
                  <Search className="w-5 h-5 text-gray-400" />
                </button>
              </form>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/products" className="text-gray-600 hover:text-[#0D47A1] font-medium transition-colors">Produk UMKM</Link>
              
              <div className="h-6 w-[1px] bg-gray-300"></div>

              {user ? (
                <>
                  {user.role === 'buyer' && (
                    <Link to="/cart" className="relative p-2 text-gray-600 hover:text-[#0D47A1] transition-colors">
                      <ShoppingBag className="w-6 h-6" />
                      {cartItems.length > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                          {cartItems.length}
                        </span>
                      )}
                    </Link>
                  )}

                  <div className="relative group">
                    <button className="flex items-center gap-2 p-2 text-gray-600 hover:text-[#0D47A1] transition-colors">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">{user.role === 'seller' && storeName ? storeName : user.name}</span>
                    </button>
                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                      <div className="p-2 space-y-1">
                        {user.role === 'buyer' && (
                          <>
                            <Link to="/buyer" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"><User className="w-4 h-4"/> Profil</Link>
                            <Link to="/buyer/orders" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"><ShoppingBag className="w-4 h-4"/> Pesanan Saya</Link>
                          </>
                        )}
                        {(user.role === 'seller' || user.role === 'admin') && (
                          <Link to={`/${user.role}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"><LayoutDashboard className="w-4 h-4"/> Dashboard {user.role === 'admin' ? 'Admin' : 'Toko'}</Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center w-full text-left gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"><LogIn className="w-4 h-4"/> Keluar</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-sm font-semibold text-[#1565C0]">Masuk</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-[#0D47A1] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#1565C0] transition-colors shadow-none">Daftar</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari telur asin, bawang merah..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-[#0D47A1] outline-none transition-all"
            />
            <button type="submit" className="absolute left-3 top-2">
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto sm:px-6 lg:px-8 pb-24 md:pb-8 pt-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center mb-4">
                <img src="/logo.png" alt="Local Laris" className="h-14 md:h-16 w-auto object-contain" />
              </Link>
              <p className="text-gray-500 text-sm max-w-sm">
                Marketplace khusus UMKM Kabupaten Brebes. Membantu digitalisasi produk lokal dan memberdayakan ekonomi daerah dengan transaksi yang mudah, cepat, dan aman.
              </p>
              <p className="text-gray-500 text-sm max-w-sm mt-4 font-medium">
                Powered by Capstone Project Kelompok C Kelas 52
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Layanan Cepat</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link to="/products" className="hover:text-[#0D47A1]">Semua Produk</Link></li>
                <li><Link to="/stores" className="hover:text-[#0D47A1]">Daftar UMKM</Link></li>
                <li><Link to="/cara-belanja" className="hover:text-[#0D47A1]">Cara Belanja</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Hubungi Kami</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li>Bantuan & Dukungan</li>
                <li>filzahfalih@gmail.com</li>
                <li>081949442165</li>
                <li>Kabupaten Brebes, Jawa Tengah</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© 2026 Local Laris Brebes. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-50 pb-safe">
        <Link to="/" className={`flex flex-col items-center ${location.pathname === '/' ? 'text-[#1565C0]' : 'text-gray-400 hover:text-[#1565C0]'}`}>
          <svg className="w-5 h-5" fill={location.pathname === '/' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Beranda</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center ${location.pathname === '/products' ? 'text-[#1565C0]' : 'text-gray-400 hover:text-[#1565C0]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Kategori</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center relative ${location.pathname === '/cart' ? 'text-[#1565C0]' : 'text-gray-400 hover:text-[#1565C0]'}`}>
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {cartItems.length}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Keranjang</span>
        </Link>
        {user?.role === 'buyer' && (
          <Link to="/buyer/orders" className={`flex flex-col items-center ${location.pathname === '/buyer/orders' ? 'text-[#1565C0]' : 'text-gray-400 hover:text-[#1565C0]'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Pesanan</span>
          </Link>
        )}
        <Link to="/buyer" className={`flex flex-col items-center ${location.pathname === '/buyer' ? 'text-[#1565C0]' : 'text-gray-400 hover:text-[#1565C0]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Akun</span>
        </Link>
      </div>
    </div>
  );
}
