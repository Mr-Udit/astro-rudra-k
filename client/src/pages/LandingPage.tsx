import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { testimonialsApi } from '@/api/testimonials';
import { useEffect, useState } from 'react';

// Services data matching the reference
const services = [
  {
    id: '1',
    name: 'Audio Consultation',
    description: 'Perfect for specific questions about career, relationships, or immediate concerns.',
    icon: 'phone',
    price: '₹599',
    duration: '/45 min'
  },
  {
    id: '2',
    name: 'Video consultation',
    description: 'Comprehensive analysis with detailed Kundli reading and personalized remedies.',
    icon: 'video',
    price: '₹999',
    duration: '/45 min'
  },
  {
    id: '3',
    name: 'Kundli-Report consultation',
    description: 'In-depth Kundli analysis and personalized remedies.',
    icon: 'chart',
    price: '₹1,499',
    duration: '/session'
  },
  {
    id: '4',
    name: 'VIP Package',
    description: 'Exclusive package with monthly follow-ups and 24/7 priority support.',
    icon: 'star',
    price: '₹5,999',
    duration: '/month'
  }
];

const features = [
  {
    id: '1',
    name: 'Expert Astrologers',
    description: 'Connect with certified Vedic astrologers with 15+ years of experience in guiding thousands of lives toward clarity and success.',
    icon: '👨‍🏫'
  },
  {
    id: '2',
    name: 'Personalized Analysis',
    description: 'Receive detailed Kundli analysis tailored to your unique birth chart, providing insights into every aspect of your life journey.',
    icon: '🎯'
  },
  {
    id: '3',
    name: '100% Confidential',
    description: 'Your privacy is our priority. All consultations are completely confidential with secure payment and data protection.',
    icon: '🔒'
  },
  {
    id: '4',
    name: 'Multiple Formats',
    description: 'Choose from video call, phone call, or chat consultations based on your comfort and convenience.',
    icon: '💬'
  },
  {
    id: '5',
    name: 'Instant Booking',
    description: 'Book consultations instantly with real-time availability. Get guidance when you need it most, without waiting.',
    icon: '⚡'
  },
  {
    id: '6',
    name: 'Remedies & Solutions',
    description: 'Receive practical, easy-to-follow remedies and solutions based on Vedic principles to overcome life\'s obstacles.',
    icon: '🌟'
  }
];

const steps = [
  {
    number: 1,
    title: 'Choose Astrologer',
    description: 'Browse through our verified expert astrologers and select based on specialization and experience.'
  },
  {
    number: 2,
    title: 'Book Session',
    description: 'Select your preferred date, time, and consultation format. Complete secure payment through our platform.'
  },
  {
    number: 3,
    title: 'Get Consultation',
    description: 'Connect with your astrologer via video, phone, or chat. Discuss your concerns and receive personalized guidance.'
  },
  {
    number: 4,
    title: 'Transform Life',
    description: 'Implement the insights and remedies provided. Watch your life transform with ancient Vedic wisdom.'
  }
];

const fallbackTestimonials = [
  {
    id: '1',
    text: 'The consultation was incredibly accurate and insightful. Pandit Raj Kumar helped me understand my career path and within 3 months, I got the promotion I was hoping for. Truly life-changing!',
    name: 'Priya Sharma',
    role: 'Software Engineer, Bangalore',
    rating: 5
  },
  {
    id: '2',
    text: 'I was skeptical at first, but Dr. Priya\'s reading was so detailed and personalized. The remedies she suggested were simple yet effective. My relationship issues have improved significantly.',
    name: 'Rahul Mehta',
    role: 'Business Owner, Mumbai',
    rating: 5
  },
  {
    id: '3',
    text: 'The platform is so easy to use and the astrologers are genuinely knowledgeable. I\'ve had multiple consultations and each one has provided valuable insights into different aspects of my life.',
    name: 'Anjali Gupta',
    role: 'Teacher, Delhi',
    rating: 5
  }
];

const zodiacSigns = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export default function LandingPage() {
  useDocumentTitle('Home');

  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await testimonialsApi.getFeatured();
        if (isMounted && data.length > 0) {
          // Map API testimonials to the shape used in this page
          setTestimonials(
            data.map((t) => ({
              id: t.id,
              text: t.text,
              name: t.name,
              role: t.role,
              rating: t.rating,
            }))
          );
        }
      } catch {
        // Silently fall back to static testimonials on error
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-background-card">
        {/* Constellation background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
                className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:space-8">
                <span className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accentGold/20 rounded-full text-xs lg:text-sm font-semibold text-accentGold">
                ✨ Trusted by 1,000+ clients worldwide
              </span>
              
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary leading-tight">
                Transform Your Life
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accentGold to-accentGold">
                  Through Vedic Wisdom
                </span>
              </h1>
              
                <p className="text-sm lg:text-lg text-text-secondary leading-relaxed max-w-lg">
                Connect with expert Vedic astrologers for personalized guidance on career, relationships, health, and spiritual growth.
                <br className="hidden sm:block" />
                Experience the ancient wisdom tailored for modern challenges.
              </p>
              
              <div className="flex flex-wrap gap-3 lg:gap-4">
                <Link to="/booking">
                    <Button className="btn-cta px-6 lg:px-8 py-2.5 lg:py-3 text-sm lg:text-lg">
                    Book Consultation
                  </Button>
                </Link>
                <Link to="/services">
                    <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 lg:px-8 py-2.5 lg:py-3 text-sm lg:text-lg rounded-xl">
                    Learn More
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-12 pt-8">
                <div className="text-center">
                                <div className="font-serif text-3xl font-bold text-secondary">1K+</div>
                                <div className="text-sm text-text-secondary">Happy Clients</div>
                </div>
                <div className="text-center">
                                <div className="font-serif text-3xl font-bold text-secondary">10+</div>
                                <div className="text-sm text-text-secondary">Expert Astrologers</div>
                </div>
                <div className="text-center">
                                <div className="font-serif text-3xl font-bold text-secondary">99%</div>
                                <div className="text-sm text-text-secondary">Accuracy Rate</div>
                </div>
              </div>
            </div>

            {/* Right Content - Zodiac Wheel */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-[280px] sm:w-[350px] md:w-[400px] lg:w-[450px] xl:w-[500px] h-[280px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px]">
                {/* Main circle */}
                                <div className="absolute inset-0 bg-gradient-to-br from-background to-background-card rounded-full shadow-2xl"></div>

                {/* Inner circle with gradient */}
                                <div className="absolute inset-[15%] bg-gradient-to-br from-accentGold/10 to-secondary/10 rounded-full animate-pulse"></div>

                {/* Center moon symbol */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30%] text-primary opacity-20">
                  ☽
                </div>

                {/* Zodiac signs in a circle - using percentage for responsive positioning */}
                {zodiacSigns.map((sign, index) => {
                  const angle = (index * 30 - 90) * (Math.PI / 180);
                  // Use percentage-based positioning (50% center + radius * cos/sin * 100%)
                  const radiusPercent = 38;
                  const x = 50 + radiusPercent * Math.cos(angle);
                  const y = 50 + radiusPercent * Math.sin(angle);
                  
                  return (
                    <div
                      key={sign}
                                          className="absolute bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white shadow-lg"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: 'clamp(20px, 5%, 36px)',
                        height: 'clamp(20px, 5%, 36px)',
                        fontSize: 'clamp(10px, 2.5vw, 16px)',
                        transform: 'translate(-50%, -50%)',
                        animation: `float 3s ease-in-out infinite`,
                        animationDelay: `${index * 0.25}s`,
                      }}
                    >
                      {sign}
                    </div>
                  );
                })}

                {/* Rating badge */}
                                <div className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 bg-background-card rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-accentGold to-accentGold rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                                      <div className="font-semibold text-secondary text-sm sm:text-base">4.9/5</div>
                                      <div className="text-xs text-text-secondary">Rating</div>
                    </div>
                  </div>
                </div>

                {/* Support badge */}
                                <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 bg-background-card rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                                      <div className="font-semibold text-secondary text-sm sm:text-base">24/7</div>
                                      <div className="text-xs text-text-secondary">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
            <section className="py-20 bg-background" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="inline-block px-4 py-2 bg-accentGold/20 rounded-full text-sm font-semibold text-accentGold mb-4">
              Why Choose Us
            </span>
                  <h2 className="font-serif text-4xl font-bold text-primary mb-4">
              Ancient Wisdom, Modern Solutions
            </h2>
                  <p className="text-lg text-text-secondary">
              Experience the perfect blend of traditional Vedic astrology and contemporary approach to life's challenges
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                      className="bg-background-card rounded-2xl p-6 lg:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                      <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-2xl lg:text-3xl mb-4 lg:mb-6">
                  {feature.icon}
                </div>
                      <h3 className="font-serif text-lg lg:text-xl font-bold text-primary mb-2 lg:mb-3">
                  {feature.name}
                </h3>
                      <p className="text-sm lg:text-base text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
            <section className="py-12 lg:py-20 bg-gradient-to-br from-background to-background-card relative overflow-hidden" id="services">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-accentGold/10 rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-16">
                  <span className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-background-card/50 rounded-full text-xs lg:text-sm font-semibold text-accentGold mb-3 lg:mb-4">
              Our Services
            </span>
                  <h2 className="font-serif text-2xl lg:text-4xl font-bold text-foreground mb-3 lg:mb-4">
              Choose Your Path to Clarity
            </h2>
                  <p className="text-sm lg:text-lg text-text-secondary">
              Premium consultation packages designed for every aspect of your life
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {services.map((service) => (
              <div
                  key={service.id}
                        className="bg-background-card rounded-2xl p-6 lg:p-8 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="text-4xl lg:text-5xl mb-3 lg:mb-4">
                    {service.icon === 'phone' && '📱'}
                    {service.icon === 'video' && '💻'}
                    {service.icon === 'chart' && '📊'}
                    {service.icon === 'star' && '💎'}
                  </div>
                        <h3 className="font-serif text-lg lg:text-xl font-bold text-primary mb-2 lg:mb-3">
                    {service.name}
                  </h3>
                        <p className="text-text-secondary text-sm mb-3 lg:mb-4 leading-relaxed">
                    {service.description}
                  </p>
                        <div className="text-2xl lg:text-3xl font-bold text-secondary mb-3 lg:mb-4">
                    {service.price}
                          <span className="text-sm font-normal text-text-secondary">{service.duration}</span>
                  </div>
                  <Link to={`/booking?service=${service.id}&serviceName=${encodeURIComponent(service.name)}`}>
                          <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80">
                      Book Now
                    </Button>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 lg:py-20 bg-background" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-16">
            <span className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accent/20 rounded-full text-xs lg:text-sm font-semibold text-accent mb-3 lg:mb-4">
              Simple Process
            </span>
            <h2 className="font-serif text-2xl lg:text-4xl font-bold text-primary mb-3 lg:mb-4">
              How It Works
            </h2>
            <p className="text-sm lg:text-lg text-muted-foreground">
              Get started with your cosmic journey in just four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-accent to-accent rounded-full flex items-center justify-center text-2xl lg:text-3xl font-bold text-white mx-auto mb-4 lg:mb-6 shadow-lg">
                  {step.number}
                </div>
                <h3 className="font-serif text-lg lg:text-xl font-bold text-primary mb-2 lg:mb-3">
                  {step.title}
                </h3>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 lg:py-20 bg-background-card" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-16">
            <span className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-accent/20 rounded-full text-xs lg:text-sm font-semibold text-accent mb-3 lg:mb-4">
              Success Stories
            </span>
            <h2 className="font-serif text-2xl lg:text-4xl font-bold text-primary mb-3 lg:mb-4">
              What Our Clients Say
            </h2>
            <p className="text-sm lg:text-lg text-muted-foreground">
              Real stories from people whose lives were transformed through our guidance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-background-elevated rounded-2xl p-8">
                <div className="text-5xl text-accent font-serif mb-4">"</div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[hsl(var(--accent))] text-accent" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-accent/15 rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="font-serif text-4xl font-bold text-white mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied clients who found clarity and direction through ancient Vedic wisdom. Your cosmic journey begins here.
          </p>
          <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
            <Link to="/booking">
              <Button className="bg-background-card text-primary hover:bg-background-elevated text-sm lg:text-lg px-6 lg:px-8 py-2.5 lg:py-3">
                Book Your First Consultation
              </Button>
            </Link>
            <a 
              href={import.meta.env.VITE_KUNDLI_APP_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 lg:py-3 text-sm lg:text-lg font-medium border-2 border-white bg-transparent text-white rounded-xl hover:bg-background-card hover:text-primary transition-all duration-200"
            >
              Get Free Kundli
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Included but controlled by App.tsx */}
    </div>
  );
}
