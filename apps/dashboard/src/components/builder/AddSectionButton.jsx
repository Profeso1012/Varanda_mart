import React, { useState } from 'react';
import SectionTypeModal from './modals/SectionTypeModal';

export default function AddSectionButton({ onAdd }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        className="add-section-wrapper" 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '12px 0',
          position: 'relative',
          zIndex: 10
        }}
      >
        <button 
          onClick={() => setShowModal(true)}
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '13px',
            color: '#4B5563',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#2563EB';
            e.currentTarget.style.color = '#2563EB';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.color = '#4B5563';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Section
        </button>
      </div>
      {showModal && (
        <SectionTypeModal
          onSelect={(type) => {
            onAdd(type);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
