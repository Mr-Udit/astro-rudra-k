import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const quickLinks = [
    { path: '/', label: 'Home' },
    { path: '/astrologers', label: 'Our Astrologers' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact Us' },
  ];

  const services = [
    'Kundli Analysis',
    'Career Guidance',
    'Love & Marriage',
    'Health Astrology',
    'Finance & Wealth',
    'Vastu Consultation',
  ];

  const legalLinks = [
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/refund', label: 'Refund Policy' },
  ];

  return (
    <footer className="glass-strong text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] flex items-center justify-center">
                <span className="text-[hsl(var(--gold))] text-xl">✦</span>
              </div>
              <span className="font-serif text-xl font-bold text-foreground">
                Astro-Rudra-K
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Transform your life through ancient Vedic wisdom. Connect with expert
              astrologers for personalized guidance on career, relationships, health,
              and spiritual growth.
            </p>
            <div className="flex gap-3">
              {[
                { key: 'facebook', Icon: Facebook },
                { key: 'twitter', Icon: Twitter },
                { key: 'instagram', Icon: Instagram },
                { key: 'youtube', Icon: Youtube },
              ].map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-gradient-to-br hover:from-[hsl(var(--gold))] hover:to-[hsl(var(--gold))] transition-all duration-300 hover:-translate-y-1"
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[hsl(var(--gold))] mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground text-sm hover:text-[hsl(var(--gold))] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[hsl(var(--gold))] mb-6">
              Our Services
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="text-muted-foreground text-sm hover:text-[hsl(var(--gold))] transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[hsl(var(--gold))] mb-6">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[hsl(var(--gold))] mt-0.5" />
                <span className="text-muted-foreground text-sm">
                  support@astro-rudra-k.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[hsl(var(--gold))] mt-0.5" />
                <span className="text-muted-foreground text-sm">
                  +91 1800-123-4567
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[hsl(var(--gold))] mt-0.5" />
                <span className="text-muted-foreground text-sm">
                  123 Spiritual Lane, Mumbai,
                  <br />
                  Maharashtra 400001, India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm text-center sm:text-left">
              © 2026 Astro-Rudra-K. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-muted-foreground text-sm hover:text-[hsl(var(--gold))] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
