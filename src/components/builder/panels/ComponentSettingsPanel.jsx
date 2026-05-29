import { useState } from 'react';
import TextComponentPanel from './components/TextComponentPanel';
import ButtonComponentPanel from './components/ButtonComponentPanel';
import ImageComponentPanel from './components/ImageComponentPanel';
import SpacerComponentPanel from './components/SpacerComponentPanel';
import DividerComponentPanel from './components/DividerComponentPanel';
import './SettingsPanels.css';

export default function ComponentSettingsPanel({
  component,
  onBack,
  onConfigUpdate,
}) {
  if (!component) return null;

  const handleConfigUpdate = (updates) => {
    if (onConfigUpdate) {
      onConfigUpdate({ ...component.config, ...updates });
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <button className="settings-panel__back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h3 className="settings-panel__title">
          {component.type} Settings
        </h3>
      </div>

      {component.type === 'TEXT' && (
        <TextComponentPanel
          config={component.config}
          onConfigUpdate={handleConfigUpdate}
        />
      )}

      {component.type === 'BUTTON' && (
        <ButtonComponentPanel
          config={component.config}
          onConfigUpdate={handleConfigUpdate}
        />
      )}

      {component.type === 'IMAGE' && (
        <ImageComponentPanel
          config={component.config}
          onConfigUpdate={handleConfigUpdate}
        />
      )}

      {component.type === 'SPACER' && (
        <SpacerComponentPanel
          config={component.config}
          onConfigUpdate={handleConfigUpdate}
        />
      )}

      {component.type === 'DIVIDER' && (
        <DividerComponentPanel
          config={component.config}
          onConfigUpdate={handleConfigUpdate}
        />
      )}
    </div>
  );
}
