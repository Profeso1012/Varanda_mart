import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import BrandAvatar from './BrandAvatar';

export default function DashboardLayout({ title, children, mode = 'seller', actions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, business } = useAuth();

  const storeName    = business?.name || 'My Store';
  const logoUrl      = business?.logoUrl || business?.logo || null;
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'W3';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        logoUrl={logoUrl}
        mode={mode}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#1F2A30]"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-[#1F2A30]">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Page-level actions (e.g. + Add Product button) */}
            {actions}
            {/* Bell */}
            <button className="relative text-[#1F2A30]">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E32323]" />
            </button>
            {/* Avatar */}
            {logoUrl ? (
              <BrandAvatar logoUrl={logoUrl} name={storeName} size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#22925B] flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
