'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, BookOpen, History, LogOut, PlusCircle } from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quizzes', label: 'My Quizzes', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-ink border-b border-cream/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="font-display text-xl text-amber-quiz">
          QuizForge
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-display tracking-wide uppercase transition-colors duration-150',
                pathname === href
                  ? 'text-amber-quiz'
                  : 'text-cream/50 hover:text-cream'
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            href="/quizzes/new"
            className="hidden sm:flex items-center gap-1.5 bg-amber-quiz text-ink px-3 py-1.5 font-display text-xs tracking-wide hover:bg-amber-light transition-colors"
          >
            <PlusCircle size={13} />
            New Quiz
          </Link>
          <span className="text-cream/40 text-xs hidden md:block">{user?.username}</span>
          <button onClick={handleLogout} className="text-cream/30 hover:text-cream transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
