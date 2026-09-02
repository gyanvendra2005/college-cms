import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Mini ERP + CRM</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500">Logged in as: </span>
              <span className="font-medium text-slate-900">{user?.name} ({user?.role})</span>
            </div>
            <button 
              onClick={logout}
              className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
