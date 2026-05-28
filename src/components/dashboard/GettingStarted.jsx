import { useNavigate } from 'react-router-dom';
// import { API_URL } from '../config/api';

/**
 * Props:
 *  - steps: { label, path, done }[]
 *  - checkColor: 'green' | 'amber'  (seller=green, supplier=amber)
 */
export default function GettingStarted({ steps, checkColor = 'green' }) {
  const navigate = useNavigate();

  const checkedBg   = checkColor === 'green' ? 'bg-[#22925B] border-[#22925B]' : 'bg-[#F59E0B] border-[#F59E0B]';
  const uncheckedBorder = 'border-gray-300 hover:border-[#22925B]';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-bold text-[#1F2A30] mb-4">Getting Started</h3>
      <ul className="space-y-3">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => step.path && navigate(step.path)}
          >
            {/* Checkbox */}
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              step.done ? checkedBg : `bg-white ${uncheckedBorder}`
            }`}>
              {step.done && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4l3 3 5-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Label — NO strikethrough, only color change */}
            <span className={`text-sm transition-colors ${
              step.done ? 'text-[#5C5D86]' : 'text-[#1F2A30] group-hover:text-[#22925B]'
            }`}>
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
