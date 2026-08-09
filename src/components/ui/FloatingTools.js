import React, { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export default function FloatingTools({ items = [], defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  
  useEffect(() => {
    // Check if user is super admin and get role
    const checkUser = async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email === 'oss.tam1137@gmail.com') {
            setIsAdmin(true); // Super Admin for Developer Tools link
          }
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (profile) {
            setUserRole(profile.role);
          }
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoadingRole(false);
      }
    };
    checkUser();
  }, []);

  if (loadingRole) return null;
  
  // Restrict FloatingTools visibility
  if (!['admin', 'super_admin', 'juri'].includes(userRole)) {
    return null;
  }

  // Merge items
  const finalItems = [...items];
  if (isAdmin) {
    // Dynamically require icon to avoid top level import issues for this specific icon if not already imported
    const { ShieldAlert } = require('lucide-react');
    finalItems.push({
      label: 'Developer Tools',
      icon: <ShieldAlert size={18} />,
      onClick: () => { window.location.href = '/developer-analytics' },
      isSpecial: true
    });
  }

  return (
    <div ref={menuRef} className="fixed right-4 bottom-32 z-50 flex flex-col items-end">
      {/* Menu Options */}
      <div 
        className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
        }`}
      >
        {finalItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (item.onClick) item.onClick();
            }}
            className="flex items-center gap-3 group justify-end w-full"
          >
            <span className={`text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm whitespace-nowrap border transition-colors ${item.isSpecial ? 'bg-black text-yellow-400 border-yellow-500/50' : 'bg-mertha-bg text-mertha-text border-mertha-border group-hover:bg-mertha-primary/5'}`}>
              {item.label}
            </span>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all shrink-0 ${
              item.isSpecial ? 'bg-black text-yellow-400 border border-yellow-500' :
              item.danger ? 'bg-mertha-error text-white' : 'bg-white text-mertha-primary border border-mertha-primary/20'
            }`}>
              {item.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-black/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-10"
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          {isOpen ? <X size={24} /> : <Settings size={24} />}
        </div>
        <span className="absolute -bottom-4 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Tools</span>
      </button>
    </div>
  );
}
