export default function BrandAvatar({ logoUrl, name = 'Store', size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'ST';

  if (logoUrl) {
    return (
      <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-100`}>
        <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-[#1F2A30]`}>
      {initials}
    </div>
  );
}
