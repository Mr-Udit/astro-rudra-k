import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const getDashboardLink = () => {
    if (hasRole('admin')) return '/admin/dashboard';
    if (hasRole('astrologer')) return '/astrologer/dashboard';
    return '/user/dashboard';
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/astrologers', label: 'Astrologers' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
            ? 'bg-background/95 backdrop-blur-md py-2 sm:py-3 shadow-md'
            : 'bg-background/80 md:bg-transparent py-3 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[hsl(var(--deep-indigo))] to-[hsl(var(--royal-purple))] flex items-center justify-center animate-rotate">
                <span className="text-[hsl(var(--rose-gold))] text-lg sm:text-xl">✦</span>
            </div>
              <span className="font-serif text-lg sm:text-2xl font-bold text-[hsl(var(--primary))]">
              Astro-Rudra-K
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link text-sm font-medium ${
                    isActive(link.path) ? 'text-primary' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                      className="flex items-center gap-2 hover:bg-accent"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--rose-gold))] to-[hsl(var(--copper))] flex items-center justify-center text-white font-semibold">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                      <span className="text-sm font-medium text-[hsl(var(--text-primary))]">
                      {user?.fullName}
                    </span>
                      <ChevronDown className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => navigate(getDashboardLink())}
                    className="cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                      className="cursor-pointer text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  to="/login"
                    className="text-sm font-medium text-[hsl(var(--text-primary))] hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-[hsl(var(--deep-indigo))] to-[hsl(var(--royal-purple))] text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-primary" />
            ) : (
                <Menu className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border animate-slide-in-up">
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium py-2 ${
                    isActive(link.path)
                        ? 'text-primary'
                        : 'text-[hsl(var(--text-primary))]'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                    <div className="flex items-center gap-3 py-2 border-t border-border">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--rose-gold))] to-[hsl(var(--copper))] flex items-center justify-center text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0)}
                      </div>
                    )}
                      <span className="text-sm font-medium text-[hsl(var(--text-primary))]">
                      {user?.fullName}
                    </span>
                  </div>
                  <button
                    onClick={() => { navigate(getDashboardLink()); setIsMobileMenuOpen(false); }}
                      className="text-left text-sm font-medium py-2 text-[hsl(var(--text-primary))]"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="text-left text-sm font-medium py-2 text-destructive"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm font-semibold text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
