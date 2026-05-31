// Sparkline SVG — pure math, no library needed
function Sparkline({ data = [], color = '#22925B' }) {
  if (!data.length) return null;

  const width  = 80;
  const height = 40;
  const max    = Math.max(...data);
  const min    = Math.min(...data);
  const range  = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  // Area fill — close the path below
  const first = points[0].split(',');
  const last  = points[points.length - 1].split(',');
  const area  = `${polyline} ${last[0]},${height} ${first[0]},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={area} fill={color} fillOpacity="0.15" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  change,       // e.g. '+12%'
  changeColor,  // 'green' | 'red'
  sparkData = [],
}) {
  const isPositive = changeColor === 'green';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col justify-between min-h-27.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#5C5D86] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[#1F2A30]">{value}</p>
        </div>
        <Sparkline data={sparkData} color="#22925B" />
      </div>
      {change && (
        <p className={`text-xs font-medium mt-2 ${
          isPositive ? 'text-[#22925B]' : 'text-[#E32323]'
        }`}>
          {change}
        </p>
      )}
    </div>
  );
}
