import { Link } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Sparkles, Star, BookOpen, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AboutPage() {
  useDocumentTitle('About Us');
  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Navbar */}
      <nav className="py-4 px-4 sm:px-6 lg:px-8 bg-background-card sticky top-0 z-50"
        style={{ boxShadow: '0 2px 20px rgba(0, 0, 0, 0.25)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover))', color: 'hsl(var(--gold))' }}>
              ✦
            </div>
            <span className="font-display text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
              Celestial Insights
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/services" className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>Services</Link>
            <Link to="/contact" className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>Contact</Link>
            <Link to="/astrologers" className="btn-primary text-sm">Book Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(230, 184, 92, 0.16), rgba(201, 150, 46, 0.16))', color: 'hsl(var(--gold))' }}>
              ✨ Discover Our Journey
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6" style={{ color: 'hsl(var(--primary))' }}>
              About Celestial Insights
            </h1>
            <p className="text-xl md:text-2xl font-medium mb-4 italic" style={{ color: 'hsl(var(--text-primary))' }}>
              "Astrology should empower decisions, not create fear."
            </p>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--text-secondary))' }}>
              A professional Vedic astrology platform built on authenticity, clarity, and ethical guidance helping you navigate life's questions with precision and responsibility.
            </p>
          </m.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="card p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(230, 184, 92, 0.16), rgba(201, 150, 46, 0.16))' }}>
                <Star className="w-10 h-10" style={{ color: 'hsl(var(--gold))' }} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
                  Led by <span style={{ color: 'hsl(var(--gold))' }}>Expert Astrologers</span>
                </h3>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Dedicated Vedic astrologers with grounded, analytical approaches and over <strong>15+ years of professional experience</strong>.
                </p>
                <p className="mt-2" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Known for clarity, ethical guidance, and practical insights rooted in authentic Vedic principles.
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-card">
        <div className="max-w-5xl mx-auto">
          <m.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ color: 'hsl(var(--primary))' }}
          >
            What We Offer
          </m.h2>

          <m.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              {
                icon: <Star className="w-10 h-10" style={{ color: 'hsl(var(--gold))' }} />,
                title: "Astrology Consultation",
                description: "Personalized Vedic consultations for career, relationships, and life guidance."
              },
              {
                icon: <BookOpen className="w-10 h-10" style={{ color: 'hsl(var(--gold))' }} />,
                title: "Ethical Guidance",
                description: "Astrology that empowers decision-making without fear-based predictions."
              }
            ].map((item) => (
              <m.div
                key={item.title}
                variants={fadeInUp}
                className="card p-8"
              >
                <div className="mb-5">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'hsl(var(--text-secondary))' }}>{item.description}</p>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      {/* Kundali Generator */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="card p-8 md:p-10"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center" style={{ color: 'hsl(var(--primary))' }}>
              Kundali Generator – Our Core Strength
            </h2>
            <p className="text-center mb-8" style={{ color: 'hsl(var(--text-secondary))' }}>
              Advanced birth chart generation system powered by precision calculations and authentic Vedic methodology.
            </p>

            <div className="space-y-5">
              {[
                "Accurate planetary placements using precise date, time, and location data",
                "D1 & divisional chart structure for comprehensive birth chart analysis",
                "Panchang & transit data to understand astrological influences clearly",
                "AstroSage-level calculation rigor ensuring precision and reliability"
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--gold))' }} />
                  <p style={{ color: 'hsl(var(--text-primary))' }}>{feature}</p>
                </div>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center card p-10 md:p-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover))' }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-white">
            Consult with Confidence
          </h2>
          <p className="text-lg text-white/90 mb-2">
            Accurate charts. Ethical guidance. No fear-based predictions.
          </p>
          <p className="text-white/80 mb-8">
            Connect with a trusted astrologer and explore precise Kundali insights.
          </p>
          <Link to="/astrologers" className="btn-white inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Consult an Astrologer
          </Link>
        </m.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            © 2026 Astro-Rudra-K. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </LazyMotion>
  );
}
