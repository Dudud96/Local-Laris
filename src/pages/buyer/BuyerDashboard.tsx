import { useAuthStore } from '../../store/authStore';
import AddressManager from './AddressManager';

export default function BuyerDashboard() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
      
      {/* Profil Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-100 text-[#0D47A1] rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0">
            {user?.name?.[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">{user?.name}</h2>
            <p className="text-sm sm:text-base text-gray-500 break-all">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs sm:text-sm font-medium capitalize">
              Role: {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Alamat Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
        <AddressManager />
      </div>
    </div>
  );
}
