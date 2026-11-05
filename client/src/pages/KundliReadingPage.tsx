import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Heart, Briefcase, Shield, ChevronLeft } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const dashaTimeline = [
  { planet: 'Venus', period: '2020-2023', status: 'completed', color: 'hsl(var(--accent))' },
  { planet: 'Sun', period: '2023-2024', status: 'current', color: 'hsl(var(--accent))' },
  { planet: 'Moon', period: '2024-2034', status: 'upcoming', color: 'hsl(var(--accent))' },
  { planet: 'Mars', period: '2034-2041', status: 'upcoming', color: 'hsl(var(--accent))' },
];

const planetaryStrengths = [
  { planet: 'Sun', strength: 85, house: '10th House', status: 'Strong' },
  { planet: 'Moon', strength: 70, house: '4th House', status: 'Good' },
  { planet: 'Mars', strength: 60, house: '3rd House', status: 'Moderate' },
  { planet: 'Mercury', strength: 90, house: '11th House', status: 'Excellent' },
  { planet: 'Jupiter', strength: 75, house: '9th House', status: 'Good' },
  { planet: 'Venus', strength: 65, house: '7th House', status: 'Moderate' },
  { planet: 'Saturn', strength: 50, house: '12th House', status: 'Weak' },
  { planet: 'Rahu', strength: 55, house: '6th House', status: 'Moderate' },
];

const remedies = [
  {
    icon: '💎',
    title: 'Yellow Sapphire',
    description: 'Wear a 5-carat natural yellow sapphire in gold ring on Thursday morning to strengthen Jupiter.',
  },
  {
    icon: '🕉️',
    title: 'Mantra Chanting',
    description: 'Recite "Om Namah Shivaya" 108 times daily during morning to balance planetary energies.',
  },
  {
    icon: '🌅',
    title: 'Surya Namaskar',
    description: 'Perform 12 rounds of sun salutations at sunrise to enhance Sun\'s positive influence.',
  },
  {
    icon: '🙏',
    title: 'Charity & Service',
    description: 'Donate yellow items on Thursdays and feed cows to appease Jupiter and reduce malefic effects.',
  },
];

const lifeAreas = [
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: 'Career & Success',
    prediction: 'Strong potential for leadership roles. Best period: 2024-2026.',
    color: 'hsl(var(--accent))',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Love & Relationships',
    prediction: 'Favorable time for marriage after mid-2025. Compatible with Taurus & Virgo.',
    color: 'hsl(var(--accent))',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Finance & Wealth',
    prediction: 'Gradual financial growth. Avoid speculation. Real estate favorable.',
    color: 'hsl(var(--accent))',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Health & Wellness',
    prediction: 'Generally good. Watch digestive system. Yoga & meditation recommended.',
    color: 'hsl(var(--accent))',
  },
];

export default function KundliReadingPage() {
  useDocumentTitle('Kundli Reading');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Navbar */}
      <nav className="py-4 px-4 sm:px-6 lg:px-8 bg-background-card sticky top-0 z-50"
        style={{ boxShadow: '0 2px 20px rgba(45, 27, 105, 0.08)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, var(--deep-indigo), var(--royal-purple))', color: 'var(--rose-gold)' }}>
              ✦
            </div>
            <span className="font-display text-xl font-bold" style={{ color: 'var(--deep-indigo)' }}>
              Celestial Insights
            </span>
          </Link>
          <Link to="/" className="btn-secondary text-sm flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2), rgba(184, 134, 11, 0.2))', color: 'var(--copper)' }}>
              ✨ Your Cosmic Blueprint
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6" style={{ color: 'var(--deep-indigo)' }}>
              Kundli Reading
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Sample birth chart analysis - Book a consultation for your personalized reading
            </p>
          </motion.div>
        </div>
      </section>

      {/* Birth Chart Info */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--deep-indigo)' }}>
              Birth Chart Summary
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Ascendant (Lagna)', value: "Aries 12°45'", icon: '♈' },
              { label: 'Moon Sign (Rashi)', value: "Cancer 22°18'", icon: '♋' },
              { label: 'Nakshatra', value: 'Pushya Pada 3', icon: '⭐' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center"
              >
                <div className="text-4xl mb-2">{item.icon}</div>
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--copper)' }}>{item.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planetary Strengths */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--deep-indigo)' }}>
              Planetary Strengths
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Analysis of each planet's position and influence in your chart
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planetaryStrengths.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.07 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold" style={{ color: 'var(--deep-indigo)' }}>{item.planet}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.house}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Excellent'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'Good' || item.status === 'Strong'
                      ? 'bg-amber-100 text-amber-700'
                      : item.status === 'Moderate'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-destructive/20 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="relative w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--off-white)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.strength}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--rose-gold), var(--copper))' }}
                  />
                </div>
                <div className="text-right mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {item.strength}% Strength
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dasha Timeline */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--deep-indigo)' }}>
              Dasha Periods
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Major planetary periods influencing your life</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5"
              style={{ background: 'linear-gradient(to bottom, var(--rose-gold), var(--copper))' }} />

            {dashaTimeline.map((dasha, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative mb-10 ${index % 2 === 0
                  ? 'md:pr-[calc(50%+3rem)]'
                  : 'md:pl-[calc(50%+3rem)] md:ml-auto'} pl-20 md:pl-0`}
              >
                <div
                  className={`absolute top-0 ${
                    index % 2 === 0 ? 'left-8 md:right-0' : 'left-8 md:left-0'
                  } w-8 h-8 rounded-full border-4 flex items-center justify-center`}
                  style={{ borderColor: 'white', backgroundColor: dasha.color }}
                >
                  <div className="w-2 h-2 rounded-full bg-background-card" />
                </div>

                <div className={`card p-6 ${
                  dasha.status === 'current'
                    ? 'border-2'
                    : ''
                }`}
                style={dasha.status === 'current' ? { borderColor: 'var(--copper)' } : {}}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-semibold" style={{ color: 'var(--deep-indigo)' }}>
                      {dasha.planet} Dasha
                    </h4>
                    {dasha.status === 'current' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: 'var(--copper)', color: 'white' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>{dasha.period}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Life Areas */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--deep-indigo)' }}>
              Life Areas Analysis
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Predictions and guidance for major life aspects</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lifeAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: area.color + '33', color: area.color }}
                >
                  {area.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--copper)' }}>
                  {area.title}
                </h3>
                <p style={{ color: 'var(--text-dark)' }}>{area.prediction}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Remedies */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--deep-indigo)' }}>
              Recommended Remedies
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Vedic solutions to enhance positive energies and reduce challenges
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {remedies.map((remedy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 flex gap-4"
              >
                <div className="text-4xl">{remedy.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--deep-indigo)' }}>
                    {remedy.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{remedy.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center card p-12"
          style={{ background: 'linear-gradient(135deg, var(--deep-indigo), var(--royal-purple))' }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-white">
            Get Your Personalized Kundli Reading
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            This is a sample reading. Book a consultation to receive your complete birth chart analysis with detailed predictions and personalized remedies.
          </p>
          <button
            onClick={() => navigate('/astrologers')}
            className="btn-white inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Book Your Reading Now
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--dark-navy)' }}>
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            © 2026 Celestial Insights. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
