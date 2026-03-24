import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Kanban, Bot, Building2, CalendarDays,
  ChevronLeft, ChevronRight, Wine, Database, LogOut, UserCog
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, profile, signOut, canViewMarketing } = useAuth();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'closer', 'sdr'] },
    { to: '/leads', icon: Users, label: 'Leads', roles: ['admin', 'supervisor', 'closer', 'sdr'] },
    { to: '/pipeline', icon: Kanban, label: 'Pipeline', roles: ['admin', 'supervisor', 'closer', 'sdr'] },
    { to: '/sdr', icon: Bot, label: 'SDR IA', roles: ['admin', 'supervisor', 'sdr'] },
    { to: '/franchises', icon: Building2, label: 'Franquias', roles: ['admin', 'supervisor'] },
    { to: '/knowledge-base', icon: Database, label: 'Banco de Dados', roles: ['admin', 'supervisor'] },
    { to: '/users', icon: UserCog, label: 'Usuários', roles: ['admin', 'supervisor'] },
    { to: '/schedule', icon: CalendarDays, label: 'Agenda', roles: ['admin', 'supervisor', 'closer', 'sdr'] },
  ];

  const visibleItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      className="h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Wine className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-sidebar-foreground font-display font-bold text-lg leading-tight">SUPER</h1>
            <p className="text-sidebar-muted text-xs font-medium -mt-0.5">FRANQUIAS</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {visibleItems.map(item => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + controls */}
      <div className="px-3 pb-4 space-y-2">
        {!collapsed && profile && (
          <div className="px-4 py-2 text-xs">
            <p className="text-sidebar-foreground font-medium truncate">{profile.display_name}</p>
            <p className="text-sidebar-muted capitalize">{role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="sidebar-item sidebar-item-inactive w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item sidebar-item-inactive w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </motion.aside>
  );
}
