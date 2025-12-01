import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-darkcard rounded-2xl shadow-md p-5 border-l-4 border-emerald-500 dark:border-emerald-600 ${className}`}>
      <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
        {title}
      </h3>
      {children}
    </div>
  );
};