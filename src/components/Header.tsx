'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PetSwitcher } from '@/components/PetSwitcher';
import { Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingInvitationsCount } from '@/hooks/usePendingInvitationsCount';

export function Header() {
  const { user } = useAuth();
  const pendingInvitationsCount = usePendingInvitationsCount();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-md">
      <div className="flex justify-between items-center"> {/* Removed px-4 */}
        <Link href="/" className="text-2xl font-bold whitespace-nowrap">
          aina-Life
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReload}
              aria-label="ページをリロード"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCw className="h-6 w-6" />
            </Button>
            <Link href="/invitations" className="relative text-primary-foreground hover:text-primary-foreground/80">
              <Bell className="h-6 w-6" />
              {pendingInvitationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Link>
            <PetSwitcher />
          </div>
        )}
      </div>
    </header>
  );
}
