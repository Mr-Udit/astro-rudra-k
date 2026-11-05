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
    <footer className="bg-[#0A0E27] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2D1B69] to-[#4A1E8C] flex items-center justify-center">
                <span className="text-[#D4A574] text-xl">✦</span>
              </div>
              <span className="font-serif text-xl font-bold">
                Astro-Rudra-K
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Transform your life through ancient Vedic wisdom. Connect with expert
              astrologers for personalized guidance on career, relationships, health,
              and spiritual growth.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon) => (
                <button
                  key={Icon.name}
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gradient-to-br hover:from-[#D4A574] hover:to-[#B8860B] transition-all duration-300 hover:-translate-y-1"
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#D4A574] mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 text-sm hover:text-[#D4A574] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#D4A574] mb-6">
              Our Services
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="text-gray-400 text-sm hover:text-[#D4A574] transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#D4A574] mb-6">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#D4A574] mt-0.5" />
                <span className="text-gray-400 text-sm">
                  support@astro-rudra-k.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#D4A574] mt-0.5" />
                <span className="text-gray-400 text-sm">
                  +91 1800-123-4567
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4A574] mt-0.5" />
                <span className="text-gray-400 text-sm">
                  123 Spiritual Lane, Mumbai,
                  <br />
                  Maharashtra 400001, India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              © 2026 Astro-Rudra-K. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-500 text-sm hover:text-[#D4A574] transition-colors"
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
