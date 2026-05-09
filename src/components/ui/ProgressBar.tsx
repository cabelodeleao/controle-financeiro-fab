import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max, color = 'bg-aero-500', showLabel = true, size = 'md',
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = value > max;
  const barColor = isOver ? 'bg-red-500' : color;
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className={`text-xs font-medium ${isOver ? 'text-red-600' : 'text-slate-500'}`}>
            {pct.toFixed(0)}%{isOver ? ' (excedido)' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
