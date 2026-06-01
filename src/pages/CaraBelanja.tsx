import React from 'react';
import { ShoppingBag, CreditCard, Package, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaraBelanja() {
  const steps = [
    {
      id: 1,
      name: 'Pilih Produk',
      description: 'Cari dan pilih produk dari berbagai UMKM Kabupaten Brebes yang tersedia di katalog kami.',
      icon: ShoppingBag,
    },
    {
      id: 2,
      name: 'Checkout & Pembayaran',
      description: 'Lanjutkan ke halaman checkout, isi alamat tujuan, dan selesaikan pembayaran.',
      icon: CreditCard,
    },
    {
      id: 3,
      name: 'Pesanan Diproses',
      description: 'Penjual (UMKM) akan memverifikasi pembayaran dan mulai menyiapkan/memproses pesanan Anda.',
      icon: Package,
    },
    {
      id: 4,
      name: 'Pesanan Diterima',
      description: 'Tunggu pesanan tiba di alamat Anda. Jangan lupa menyelesaikan pesanan di aplikasi saat sudah diterima.',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl text-center">
            Cara Belanja di Local Laris
          </h1>
          <p className="mt-4 text-lg text-gray-500 text-center">
            Ikuti 4 langkah mudah berikut untuk mulai berbelanja produk UMKM Kabupaten Brebes favorit Anda.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-between">
            <span className="bg-white pr-4 text-sm font-medium text-gray-500">Mulai</span>
            <span className="bg-white pl-4 text-sm font-medium text-gray-500">Selesai</span>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="relative bg-gray-50 rounded-2xl p-6 hover:bg-blue-50 transition-colors border border-gray-100">
              <div className="absolute -top-6 left-6 inline-flex p-3 bg-[#0D47A1] rounded-xl shadow-lg">
                <step.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="mt-6">
                <span className="text-[#0D47A1] font-bold text-sm bg-blue-100 px-2 py-1 rounded mb-3 inline-block">Langkah {step.id}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link 
            to="/products"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-[#0D47A1] hover:bg-blue-800 shadow-sm transition-colors"
          >
            Mulai Belanja Sekarang
            <ShoppingBag className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
