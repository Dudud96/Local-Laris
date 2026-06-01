import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Store, LayoutDashboard, Package, ShoppingBag, Settings, LogOut, FileText, CheckSquare, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminLayout({ role }: { role: 'admin' | 'seller' }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [storeName, setStoreName] = useState<string>('');

  useEffect(() => {
    if (role === 'seller' && user?.uid) {
      getDoc(doc(db, 'stores', user.uid)).then(docSnap => {
        if (docSnap.exists()) {
          setStoreName(docSnap.data().storeName || '');
        }
      });
    }
  }, [role, user?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sellerMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/seller' },
    { label: 'Produk Saya', icon: Package, path: '/seller/products' },
    { label: 'Pesanan Masuk', icon: ShoppingBag, path: '/seller/orders' },
    { label: 'Pengaturan Toko', icon: Settings, path: '/seller/settings' },
  ];

  const adminMenu = [
    { label: 'Ringkasan', icon: LayoutDashboard, path: '/admin' },
    { label: 'Validasi UMKM', icon: CheckSquare, path: '/admin/stores' },
    { label: 'Kelola Kategori', icon: Package, path: '/admin/categories' },
    { label: 'Kelola Pengguna', icon: Users, path: '/admin/users' },
    { label: 'Validasi Pembayaran', icon: FileText, path: '/admin/payments' },
  ];

  const menu = role === 'admin' ? adminMenu : sellerMenu;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen z-20">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Local Laris" className="h-10 w-auto object-contain" />
          </Link>
          <span className="text-xs font-bold text-[#F4B400] uppercase tracking-wider">
            {role === 'admin' ? 'Admin' : 'Seller'}
          </span>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-1 px-4">
          {menu.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                location.pathname === item.path 
                  ? "bg-[#0D47A1] text-white" 
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#0D47A1]"
              )}
            >
              {React.createElement(item.icon, { className: "w-5 h-5" })}
              {item.label}
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
           >
             <LogOut className="w-5 h-5" />
             Keluar Akun
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Link to="/" className="md:hidden text-gray-500 hover:text-gray-900 p-1">
              <LogOut className="w-5 h-5 rotate-180" />
            </Link>
            <div className="font-semibold text-gray-800">
              {menu.find(m => m.path === location.pathname)?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-sm text-right">
               <div className="font-medium text-gray-900">{role === 'seller' && storeName ? storeName : user?.name}</div>
               <div className="text-gray-500 text-xs">{user?.email}</div>
             </div>
             <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#0D47A1] font-bold">
               {(role === 'seller' && storeName ? storeName : (user?.name || '')).charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-x-auto">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 min-w-[4rem]",
              location.pathname === item.path
                ? "text-[#1565C0]"
                : "text-gray-400 hover:text-[#1565C0]"
            )}
          >
            {React.createElement(item.icon, { className: "w-5 h-5" })}
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-center truncate w-full px-1">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
