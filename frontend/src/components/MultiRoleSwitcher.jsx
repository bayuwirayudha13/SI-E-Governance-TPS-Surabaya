import React, { useState } from 'react';
import WargaPanel from './WargaPanel';
import AdminPanel from './AdminPanelNew';
import SuperadminPanel from './SuperadminPanel';
import PetugasPanel from './PetugasPanel';
import PetugasTpsPanel from './PetugasTpsPanel';

export default function MultiRoleSwitcher() {
  const [activeTab, setActiveTab] = useState('petugas-tps');

  // Mock users for each role to preview immediately
  const users = {
    warga: { id: 1, name: 'Warga Demo', role: 'warga', email: 'bayuwirayudha84@gmail.com' },
    admin: { id: 2, name: 'Admin Desa', role: 'admin', email: 'admin@sampahpintar.com' },
    superadmin: { id: 3, name: 'Superadmin Pusat', role: 'superadmin', email: 'superadmin@sampahpintar.com' },
    petugasTps: { id: 8, name: 'Budi', nama_lengkap: 'Budi', role: 'petugas', email: 'budi@sipetasan.com', wilayah_kelurahan: 'Sukamaju' },
    petugasPengangkut: { id: 5, name: 'Hendra', nama_lengkap: 'Hendra', role: 'driver', email: 'hendra@sipetasan.com' }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Multi-Tab Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <span className="font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent text-lg">
            ♻️ Multi-Role Viewer
          </span>
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
            Buka Semua Panel dalam 1 Browser
          </span>
        </div>
        
        <div className="flex space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('petugas-tps')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'petugas-tps' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏢 Petugas TPS
          </button>
          <button
            onClick={() => setActiveTab('petugas')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'petugas' 
                ? 'bg-amber-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🚚 Petugas Pengangkut
          </button>
          <button
            onClick={() => setActiveTab('warga')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'warga' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👤 Warga Panel
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'admin' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛡️ Admin Panel
          </button>
          <button
            onClick={() => setActiveTab('superadmin')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'superadmin' 
                ? 'bg-purple-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👑 Superadmin Panel
          </button>
        </div>

        <div>
          <a
            href="#beranda"
            onClick={() => window.location.hash = 'beranda'}
            className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
          >
            Keluar ke Beranda
          </a>
        </div>
      </div>

      {/* Main Content Area per Tab */}
      <div className="flex-1 overflow-auto bg-slate-900">
        {activeTab === 'petugas-tps' && (
          <PetugasTpsPanel 
            currentUser={users.petugasTps} 
            onLogout={() => alert('Demo Mode Petugas TPS')} 
          />
        )}
        {activeTab === 'petugas' && (
          <PetugasPanel 
            currentUser={users.petugasPengangkut} 
            onLogout={() => alert('Demo Mode Petugas Pengangkut')} 
          />
        )}
        {activeTab === 'warga' && (
          <WargaPanel 
            currentUser={users.warga} 
            onLogout={() => alert('Demo Mode Warga')} 
          />
        )}
        {activeTab === 'admin' && (
          <AdminPanel 
            currentUser={users.admin} 
            onLogout={() => alert('Demo Mode Admin')} 
          />
        )}
        {activeTab === 'superadmin' && (
          <SuperadminPanel 
            currentUser={users.superadmin} 
            onLogout={() => alert('Demo Mode Superadmin')} 
          />
        )}
      </div>
    </div>
  );
}
