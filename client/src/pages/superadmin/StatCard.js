import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
  yellow: 'from-yellow-400 to-yellow-500 text-gray-900',
  blue: 'from-blue-500 to-blue-600 text-white',
  green: 'from-green-500 to-green-600 text-white',
  purple: 'from-purple-500 to-purple-600 text-white',
  pink: 'from-pink-500 to-pink-600 text-white'
};

const StatCard = ({ icon: Icon, label, value, color = 'yellow', onClick }) => {
  const gradient = colorMap[color] || colorMap.yellow;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
