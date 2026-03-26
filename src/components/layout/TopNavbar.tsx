import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { StatusBadge } from '@/components/shared/Badges';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LogOut, User, ChevronDown, Hexagon, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopNavbar() {
  const { address, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const [notifs] = useState(3);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('chainedu-theme') === 'dark');

  useEffect(() => {
     document.documentElement.classList.toggle('dark', isDark);
     localStorage.setItem('chainedu-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleDisconnect = () => { disconnectWallet(); navigate('/'); };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 gap-4 sticky top-0 z-30">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex-1" />

      {/* Network badge */}
      <StatusBadge variant="success" pulse>
        <Hexagon className="h-3 w-3" /> Polygon zkEVM Cardona
      </StatusBadge>



      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
        {notifs > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
            {notifs}
          </span>
        )}
      </Button>

      {/* Profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-mono text-xs hidden sm:inline">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="font-mono text-xs">{address}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
