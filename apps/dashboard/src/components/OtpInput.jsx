import { useRef, useEffect } from 'react';

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange, error, disabled }) {
  const inputRefs = useRef([]);

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, char) => {
    if (!/^\d*$/.test(char)) return; // digits only
    const updated = [...value];
    updated[index] = char.slice(-1);
    onChange(updated);
    // Auto-advance
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        // Clear current box
        const updated = [...value];
        updated[index] = '';
        onChange(updated);
      } else if (index > 0) {
        // Move to previous box
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    onChange(updated);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const boxClass = (index) => {
    const base = 'w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg outline-none transition-colors';
    if (disabled)      return `${base} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed`;
    if (error)         return `${base} border-[#E32323] text-[#1F2A30]`;
    if (value[index])  return `${base} border-[#22925B] text-[#1F2A30]`;
    if (index === 0 && value.every(v => !v)) return `${base} border-[#22925B] text-[#1F2A30] focus:border-[#22925B]`;
    return `${base} border-gray-200 text-[#1F2A30] focus:border-[#22925B]`;
  };

  return (
    <div className="flex justify-center gap-3">
      {Array(OTP_LENGTH).fill('').map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={boxClass(i)}
        />
      ))}
    </div>
  );
}
