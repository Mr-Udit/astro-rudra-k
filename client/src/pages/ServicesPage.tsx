import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, IndianRupee, Headphones, Video, MessageSquare, Star as StarIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Testimonial } from '@/types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const hardcodedServices = [
  {
    id: '1',
    name: 'Audio Consultation',
    description: 'Personalized audio consultation with experienced astrologers',
    icon: 'headphones',
    price: 499,
    duration: '30 mins',
    features: [
      '30-minute audio call',
      'Birth chart analysis',
      'Q&A session',
      'Follow-up email summary'
    ]
  },
  {
    id: '2', 
    name: 'Video Consultation',
    description: 'Face-to-face video consultation for detailed analysis',
    icon: 'video',
    price: 799,
    duration: '45 mins',
    features: [
      '45-minute video call',
      'Live chart reading',
      'Visual explanations',
      'Screen sharing support'
    ]
  },
  {
    id: '3',
    name: 'Chat Consultation', 
    description: 'Text-based consultation for quick queries',
    icon: 'message',
    price: 299,
    duration: 'Unlimited',
    features: [
      'Unlimited chat session',
      'Written guidance',
      'Multiple queries',
      'Detailed responses'
    ]
  },
  {
    id: '4',
    name: 'Kundli Generator',
    description: 'Generate accurate birth chart with detailed analysis',
    icon: 'star',
    price: 199,
    duration: 'Instant',
    features: [
      'Accurate birth chart',
      'Planetary positions',
      'Dosha analysis',
      'Remedy suggestions'
    ]
  }
];

export default function ServicesPage() {
  useDocumentTitle('Services');
  const [services] = useState(hardcodedServices);
  const [testimonials] = useState<Testimonial[]>([
    {
      id: '1',
      text: "The astrologer provided incredible insights that helped me navigate a difficult period in my life.",
      name: "Rajat Sharma",
      avatar: "/placeholder-avatar.jpg",
      date: "2024-01-15",
      rating: 5
    },
    {
      id: '2',
      text: "Excellent consultation experience. The guidance I received was spot on.",
      name: "Priya Gupta",
      avatar: "/placeholder-avatar.jpg",
      date: "2024-01-10",
      rating: 5
    },
    {
      id: '3',
      text: "Professional and knowledgeable astrologer. Highly recommend the video consultation.",
      name: "Amit Patel",
      avatar: "/placeholder-avatar.jpg",
      date: "2024-01-05",
      rating: 5
    }
  ]);

  const getServiceIcon = (iconName: string) => {
    switch(iconName) {
      case 'headphones':
        return Headphones;
      case 'video':
        return Video;
      case 'message':
        return MessageSquare;
      case 'star':
        return StarIcon;
      default:
        return StarIcon;
    }
  };



  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="font-serif text-5xl font-bold text-primary mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Experience personalized astrological services to guide you through life's journey.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {services.map((service) => {
              const IconComponent = getServiceIcon(service.icon);
              return (
                <Card key={service.id} className="group bg-background-card rounded-2xl shadow-lg shadow-[hsl(var(--primary))]/5 border border-border hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="p-6 border-b border-border">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-serif text-primary">
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-primary mb-2">{service.name}</h3>
                        <p className="text-muted-foreground mb-4">{service.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-background text-primary border-accent">
                        ₹{service.price}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          <span>Per session</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-primary mb-2">Features:</h4>
                        <ul className="space-y-1">
                          {service.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <StarIcon className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {service.name === 'Kundli Generator' ? (
                      <a 
                        href={import.meta.env.VITE_KUNDLI_APP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-gradient-to-r from-accent to-accent text-white rounded-lg hover:from-accent/80 hover:to-accent/80 transition-all duration-200"
                      >
                        Explore Now
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link to={`/booking?service=${service.id}&serviceName=${encodeURIComponent(service.name)}`}>
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white">
                          Book Now
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
      <section className="py-16 bg-background-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl font-bold text-primary mb-4">
              What Our Clients Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Hear from people whose lives have been transformed by our services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-background rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
