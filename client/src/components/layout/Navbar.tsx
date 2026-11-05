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
          ? 'bg-white/95 backdrop-blur-md py-2 sm:py-3 shadow-lg'
          : 'bg-white/80 md:bg-transparent py-3 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#2D1B69] to-[#4A1E8C] flex items-center justify-center animate-rotate">
              <span className="text-[#D4A574] text-lg sm:text-xl">✦</span>
            </div>
            <span className="font-serif text-lg sm:text-2xl font-bold text-[#2D1B69]">
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
                  isActive(link.path) ? 'text-[#4A1E8C]' : ''
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
                    className="flex items-center gap-2 hover:bg-[#F5F2EB]"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] flex items-center justify-center text-white font-semibold">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#1A1A2E]">
                      {user?.fullName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#6B6B80]" />
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
                    className="cursor-pointer text-red-600"
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
                  className="text-sm font-medium text-[#1A1A2E] hover:text-[#4A1E8C] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2D1B69] to-[#4A1E8C] text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-[#2D1B69]/30 transition-all duration-300 hover:-translate-y-0.5"
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
              <X className="w-6 h-6 text-[#2D1B69]" />
            ) : (
              <Menu className="w-6 h-6 text-[#2D1B69]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 animate-slide-in-up">
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium py-2 ${
                    isActive(link.path)
                      ? 'text-[#4A1E8C]'
                      : 'text-[#1A1A2E]'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 py-2 border-t border-gray-100">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] flex items-center justify-center text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#1A1A2E]">
                      {user?.fullName}
                    </span>
                  </div>
                  <button
                    onClick={() => { navigate(getDashboardLink()); setIsMobileMenuOpen(false); }}
                    className="text-left text-sm font-medium py-2 text-[#1A1A2E]"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="text-left text-sm font-medium py-2 text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-[#1A1A2E]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-3 bg-gradient-to-r from-[#2D1B69] to-[#4A1E8C] text-white rounded-full text-sm font-semibold text-center"
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
