import React from 'react';

export default function RoleBadge({ role }) {
  const badgeColors = {
    'super_admin': 'bg-red-500/20 text-red-500 border-red-500/30',
    'admin': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    'merchant': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    'juri': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    'user': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  };
  
  const color = badgeColors[role] || badgeColors['user'];
  const displayRole = role ? role.replace('_', ' ') : 'USER';
  
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${color}`}>
      {displayRole}
    </span>
  );
}
