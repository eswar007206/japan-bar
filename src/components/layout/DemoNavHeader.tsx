/**
 * Demo Navigation Header
 * Sticky header with links to all sections for testing
 */

import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}

function NavLink({ to, label, icon, active, variant = 'default' }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        active && 'bg-muted',
        variant === 'primary' && 'text-primary hover:text-primary/80',
        variant === 'secondary' && 'text-secondary hover:text-secondary/80',
        variant === 'default' && 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export default function DemoNavHeader() {
  const location = useLocation();
  const path = location.pathname;

  const isHome = path === '/';
  const isCustomer = path.startsWith('/customer');
  const isCast = path.startsWith('/cast');
  const isStaff = path.startsWith('/staff');

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-2 backdrop-blur">
      <Link 
        to="/" 
        className={cn(
          'flex items-center gap-2 text-sm font-medium transition-colors',
          isHome ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Home className="h-4 w-4" />
        <span className="hidden xs:inline">トップ</span>
      </Link>
      
      <nav className="flex items-center gap-1">
        <NavLink
          to="/customer/demo-token-1"
          label="お客様"
          icon={<Users className="h-3.5 w-3.5" />}
          active={isCustomer}
        />
        <NavLink
          to="/cast/login"
          label="キャスト"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          active={isCast}
          variant="primary"
        />
        <NavLink
          to="/staff"
          label="スタッフ"
          icon={<Shield className="h-3.5 w-3.5" />}
          active={isStaff}
          variant="secondary"
        />
      </nav>
    </header>
  );
}
