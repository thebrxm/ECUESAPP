import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  highlight?: boolean;
}

export const Counter: React.FC<CounterProps> = ({ label, value, onChange, min = 0, highlight = false }) => {
  const handleDecrement = () => {
    if (value > min) onChange(-1);
  };

  const handleIncrement = () => {
    onChange(1);
  };

  return (
    <div className={`flex flex-col items-center p-3 rounded-xl bg-white dark:bg-darkcard shadow-sm border border-gray-200 dark:border-gray-600 transition-all ${highlight ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 text-center h-10 flex items-center justify-center">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Disminuir"
        >
          <Minus size={18} />
        </button>
        <span className="text-2xl font-bold w-12 text-center font-mono">
          {value}
        </span>
        <button
          onClick={handleIncrement}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
          aria-label="Aumentar"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};