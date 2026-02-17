
import React, { useState } from 'react';
import { User, UserRole, Booking } from '../types';
import { Calendar, Clock, MapPin, Phone, Settings, LogOut, CheckCircle, XCircle, AlertCircle, TrendingUp, DollarSign, User as UserIcon, Shield } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

// Mock Data Generators
const generateMockBookings = (role: UserRole): Booking[] => {
  const common = {
    issue: "Engine making strange noise when accelerating",
    date: "2024-05-20",
  };
  
  if (role === UserRole.CLIENT) {
    return [
      { id: '1', providerId: 'p1', providerName: 'Garage Expert Auto', clientId: 'me', clientName: 'Me', clientPhone: '', date: '2024-05-20', issue: 'Oil Change', status: 'PENDING' },
      { id: '2', providerId: 'p2', providerName: 'Rapid Towing Oran', clientId: 'me', clientName: 'Me', clientPhone: '', date: '2024-05-18', issue: 'Car Breakdown', status: 'COMPLETED', price: 5000 },
      { id: '3', providerId: 'p3', providerName: 'Sétif Spare Parts', clientId: 'me', clientName: 'Me', clientPhone: '', date: '2024-05-15', issue: 'Brake Pads Order', status: 'CONFIRMED' },
    ];
  } else {
    // Professional View
    return [
      { id: '101', providerId: 'me', providerName: 'My Shop', clientId: 'c1', clientName: 'Amine Benali', clientPhone: '0550112233', date: '2024-05-21', issue: 'Brake replacement required', status: 'PENDING' },
      { id: '102', providerId: 'me', providerName: 'My Shop', clientId: 'c2', clientName: 'Sarah K.', clientPhone: '0660998877', date: '2024-05-21', issue: 'Full Diagnostic', status: 'CONFIRMED' },
      { id: '103', providerId: 'me', providerName: 'My Shop', clientId: 'c3', clientName: 'Karim T.', clientPhone: '0770554433', date: '2024-05-20', issue: 'Towing Request - Highway East', status: 'COMPLETED', price: 8000 },
    ];
  }
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKINGS' | 'SETTINGS'>('OVERVIEW');
  const [bookings, setBookings] = useState<Booking[]>(generateMockBookings(user.role));
  const [isAvailable, setIsAvailable] = useState(user.isAvailable ?? true);

  const handleStatusChange = (id: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // --- SUB-COMPONENTS ---

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  const ClientOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Bookings" value={bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length} icon={Calendar} color="bg-blue-500" />
        <StatCard title="Total Spent" value="12,500 DA" icon={DollarSign} color="bg-green-500" />
        <StatCard title="Completed Services" value={bookings.filter(b => b.status === 'COMPLETED').length} icon={CheckCircle} color="bg-purple-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {bookings.map(booking => (
            <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Wrench size={20} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{booking.providerName}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{booking.issue}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {booking.date}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
              {booking.status === 'COMPLETED' && (
                <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Leave Review
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfessionalOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
        <div>
          <h2 className="text-2xl font-bold mb-1">Welcome, {user.name}</h2>
          <p className="text-blue-100 opacity-90">Manage your garage and incoming requests.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
           <span className="text-sm font-medium">{isAvailable ? 'Online' : 'Offline'}</span>
           <button 
             onClick={() => setIsAvailable(!isAvailable)}
             className={`w-12 h-6 rounded-full p-1 transition-colors ${isAvailable ? 'bg-green-400' : 'bg-slate-400'}`}
           >
             <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Pending Requests" value={bookings.filter(b => b.status === 'PENDING').length} icon={AlertCircle} color="bg-yellow-500" />
        <StatCard title="Today's Jobs" value="5" icon={Calendar} color="bg-blue-500" />
        <StatCard title="Total Revenue" value="145k DA" icon={DollarSign} color="bg-green-500" />
        <StatCard title="Rating" value="4.8" icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Incoming Requests</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {bookings.filter(b => b.status === 'PENDING').length === 0 ? (
             <div className="p-8 text-center text-slate-400">No pending requests at the moment.</div>
          ) : (
            bookings.filter(b => b.status === 'PENDING').map(booking => (
              <div key={booking.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{booking.clientName}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Phone size={14} /> {booking.clientPhone}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {booking.date}</span>
                    </div>
                    <div className="mt-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 inline-block">
                      Issue: <span className="font-medium">{booking.issue}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle size={18} /> Decline
                  </button>
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <CheckCircle size={18} /> Accept Job
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const AdminOverview = () => (
    <div className="space-y-6">
       <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Admin Control Center</h2>
            <p className="text-slate-400">System overview and user management.</p>
          </div>
          <Shield className="absolute right-[-20px] bottom-[-40px] text-slate-800 w-48 h-48 opacity-50" />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="12,340" icon={UserIcon} color="bg-blue-500" />
        <StatCard title="Verified Providers" value="845" icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Pending Approvals" value="12" icon={AlertCircle} color="bg-orange-500" />
        <StatCard title="Reports" value="3" icon={AlertCircle} color="bg-red-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold mb-4">Pending Provider Approvals</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500">
              <th className="pb-3">Name</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Wilaya</th>
              <th className="pb-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {[1,2,3].map(i => (
              <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-4 font-medium">Garage Auto {i}</td>
                <td className="py-4 text-sm text-slate-500">Mechanic</td>
                <td className="py-4 text-sm text-slate-500">Algiers</td>
                <td className="py-4 text-right">
                  <button className="text-blue-600 hover:underline text-sm font-medium">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your account and services</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm sticky top-24">
               <nav className="space-y-2">
                 <button 
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                      activeTab === 'OVERVIEW' 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                 >
                   <TrendingUp size={20} /> Overview
                 </button>
                 <button 
                    onClick={() => setActiveTab('BOOKINGS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                      activeTab === 'BOOKINGS' 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                 >
                   <Calendar size={20} /> 
                   {user.role === UserRole.CLIENT ? 'My Bookings' : 'Requests'}
                 </button>
                 <button 
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                      activeTab === 'SETTINGS' 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                 >
                   <Settings size={20} /> Settings
                 </button>
               </nav>

               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'OVERVIEW' && (
              <div className="animate-fade-in">
                {user.role === UserRole.CLIENT && <ClientOverview />}
                {(user.role === UserRole.MECHANIC || user.role === UserRole.TOWING || user.role === UserRole.PARTS_SHOP) && <ProfessionalOverview />}
                {user.role === UserRole.ADMIN && <AdminOverview />}
              </div>
            )}

            {activeTab === 'BOOKINGS' && (
               <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 min-h-[400px]">
                 <h2 className="text-xl font-bold mb-6">
                   {user.role === UserRole.CLIENT ? 'Booking History' : 'Service Requests'}
                 </h2>
                 {/* Reusing the logic from Overview components for simplicity, but expanded */}
                 {bookings.length === 0 ? (
                   <div className="text-center py-12 text-slate-400">No bookings found.</div>
                 ) : (
                   <div className="space-y-4">
                     {bookings.map(b => (
                       <div key={b.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          <div className="flex justify-between items-start">
                             <div>
                               <h4 className="font-bold text-slate-800 dark:text-white">{user.role === UserRole.CLIENT ? b.providerName : b.clientName}</h4>
                               <p className="text-sm text-slate-500">{b.issue}</p>
                               <div className="flex gap-4 mt-2 text-sm text-slate-400">
                                  <span>{b.date}</span>
                                  {b.price && <span>{b.price} DA</span>}
                               </div>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(b.status)}`}>{b.status}</span>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {activeTab === 'SETTINGS' && (
              <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 min-h-[400px]">
                 <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                 <form className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <input type="text" defaultValue={user.name} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                      <input type="email" defaultValue={user.email} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                      <input type="tel" defaultValue={user.phone || '0550...'} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 mt-4">Save Changes</button>
                 </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import { Wrench } from 'lucide-react';
