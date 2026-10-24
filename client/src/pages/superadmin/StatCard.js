import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
  yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  purple: 'bg-violet-50 text-violet-700 ring-violet-100',
  pink: 'bg-rose-50 text-rose-700 ring-rose-100'
};

const StatCard = ({ icon: Icon, label, value, color = 'yellow', onClick }) => {
  const iconStyle = colorMap[color] || colorMap.yellow;
  const Card = onClick ? motion.button : motion.div;

  return (
    <Card
      whileHover={{ y: -4 }}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={`group flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${iconStyle}`}>
        <Icon size={21} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
      </div>
      {onClick && <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"><span aria-hidden="true">→</span></span>}
    </Card>
  );
};

export default StatCard;
