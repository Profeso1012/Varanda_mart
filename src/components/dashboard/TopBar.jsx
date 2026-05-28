import { Menu, Bell } from 'lucide-react';

export default function TopBar({ title, onMenuClick }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-[#1F2A30] hover:text-[#22925B] transition-colors"
      >
        <Menu size={22} />
      </button>

      <h1 className="text-lg font-semibold text-[#1F2A30] lg:ml-0 ml-3">
        {title}
      </h1>

      <button className="relative text-[#1F2A30] hover:text-[#22925B] transition-colors">
        <Bell size={22} />
        {/* Notification dot — show when there are unread notifications */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E32323]" />
      </button>
    </header>
  );
}
