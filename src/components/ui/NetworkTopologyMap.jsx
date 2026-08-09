import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Network, Laptop } from 'lucide-react';

// Koordinat Node dalam sistem persentase/SVG (0-100)
const nodes = {
  client1: { id: 'client1', label: 'Mobile App', type: 'client', x: 15, y: 85, icon: <Laptop size={14} /> },
  client2: { id: 'client2', label: 'Web Panel', type: 'client', x: 85, y: 85, icon: <Laptop size={14} /> },
  switch1: { id: 'switch1', label: 'Load Balancer A', type: 'switch', x: 35, y: 55, icon: <Network size={14} /> },
  switch2: { id: 'switch2', label: 'Load Balancer B', type: 'switch', x: 65, y: 55, icon: <Network size={14} /> },
  server:  { id: 'server', label: 'Backend API', type: 'server', x: 35, y: 15, icon: <Server size={14} /> },
  db:      { id: 'db', label: 'Supabase DB', type: 'db', x: 75, y: 15, icon: <Database size={14} /> },
};

// Hubungan Statis (Garis)
const edges = [
  { from: 'client1', to: 'switch1' },
  { from: 'client2', to: 'switch2' },
  { from: 'client1', to: 'switch2' }, // Cross-connect untuk mesh
  { from: 'client2', to: 'switch1' }, // Cross-connect
  { from: 'switch1', to: 'switch2' }, // Switch interconnect
  { from: 'switch1', to: 'server' },
  { from: 'switch2', to: 'server' },
  { from: 'server', to: 'db' }
];

export default function NetworkTopologyMap({ logs = [] }) {
  const [activePackets, setActivePackets] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  // Simulasi arus trafik jaringan terus menerus berdasarkan log API
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const interval = setInterval(() => {
      // Ambil 1 log secara bergilir
      const currentLog = logs[logIndex % logs.length];
      setLogIndex(prev => prev + 1);

      // Tentukan rute animasi
      // Acak client asal (1 atau 2)
      const startNode = Math.random() > 0.5 ? 'client1' : 'client2';
      const switchNode = startNode === 'client1' ? 'switch1' : 'switch2';
      
      const route = [
        { x: nodes[startNode].x, y: nodes[startNode].y },
        { x: nodes[switchNode].x, y: nodes[switchNode].y },
        { x: nodes.server.x, y: nodes.server.y },
        { x: nodes.db.x, y: nodes.db.y } // Menuju DB untuk fetch/save
      ];

      const packetId = Date.now() + Math.random();
      
      // Tentukan warna berdasarkan metode request
      let color = '#3b82f6'; // Biru default (GET)
      if (currentLog.method === 'POST') color = '#10b981'; // Hijau
      if (currentLog.method === 'PUT' || currentLog.method === 'PATCH') color = '#f59e0b'; // Kuning
      if (currentLog.method === 'DELETE') color = '#ef4444'; // Merah

      setActivePackets(prev => [...prev, { id: packetId, route, color, log: currentLog }]);

      // Hapus paket setelah selesai animasi (durasi sekitar 3 detik)
      setTimeout(() => {
        setActivePackets(prev => prev.filter(p => p.id !== packetId));
      }, 3000);

    }, 1500); // Trigger paket setiap 1.5 detik

    return () => clearInterval(interval);
  }, [logs, logIndex]);

  return (
    <div className="relative w-full h-[300px] bg-black/40 rounded-3xl overflow-hidden border border-[#333]">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        
        {/* Render Edges (Kabel Jaringan) */}
        {edges.map((edge, idx) => {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          return (
            <line 
              key={idx}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
              stroke="#333" 
              strokeWidth="0.5" 
              strokeDasharray="1 1"
              className="opacity-50"
            />
          );
        })}

        {/* Render Active Packets (Bola Cahaya) */}
        <AnimatePresence>
          {activePackets.map(packet => (
            <motion.circle
              key={packet.id}
              r="1.5"
              fill={packet.color}
              initial={{ cx: packet.route[0].x, cy: packet.route[0].y, opacity: 0 }}
              animate={{ 
                cx: packet.route.map(pt => pt.x),
                cy: packet.route.map(pt => pt.y),
                opacity: [0, 1, 1, 1, 0] // Fade in dan fade out di akhir
              }}
              transition={{ 
                duration: 2.5, // Waktu perjalanan penuh
                ease: "linear",
                times: [0, 0.1, 0.8, 0.9, 1] // Keyframes timing
              }}
              style={{ filter: `drop-shadow(0 0 4px ${packet.color})` }}
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* Render Node UI Overlay */}
      {Object.values(nodes).map(node => (
        <div 
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div className={`p-2 rounded-xl flex items-center justify-center border shadow-xl backdrop-blur-md z-10 
            ${node.type === 'server' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
              node.type === 'db' ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
              node.type === 'switch' ? 'bg-[#222]/80 border-[#444] text-gray-300' :
              'bg-[#1a1a1a]/80 border-[#333] text-gray-400'
            }
          `}>
            {node.icon}
          </div>
          <span className="text-[9px] font-bold mt-1 text-gray-500 uppercase tracking-widest whitespace-nowrap bg-black/50 px-1 rounded">
            {node.label}
          </span>
        </div>
      ))}

      {/* Tampilkan Teks Log Terbaru (Tooltip Animasi) */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-20 w-auto max-w-[90%]">
        <AnimatePresence>
          {activePackets.slice(-3).reverse().map(packet => (
            <motion.div 
              key={packet.id}
              initial={{ opacity: 0, x: -20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-black/90 backdrop-blur-md border border-[#333] px-3 py-2 rounded-md text-[10px] sm:text-xs shadow-xl font-mono flex items-center gap-3"
            >
              <div className={`w-2 h-2 rounded-full shrink-0`} style={{backgroundColor: packet.color, filter: `drop-shadow(0 0 4px ${packet.color})`}}></div>
              <span className="text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {/* Highlight HTTP Status */}
                {packet.log.desc.split(' ').map((word, i) => {
                  if (word === '200' || word === '201') return <span key={i} className="text-green-400 font-bold mx-1">{word}</span>;
                  if (word === '404' || word === '500') return <span key={i} className="text-red-400 font-bold mx-1">{word}</span>;
                  if (word.startsWith('in') && word.endsWith('ms')) return <span key={i} className="text-yellow-500 mx-1">{word}</span>;
                  return <span key={i} className="mx-0.5">{word}</span>;
                })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
