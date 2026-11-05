import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ConstellationBg from '@/components/ui-custom/ConstellationBg';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ContactPage() {
  useDocumentTitle('Contact Us');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Message sent successfully! We will get back to you soon.');
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'support@celestialinsights.com',
      description: 'We reply within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+91 1800-123-4567',
      description: 'Mon-Sat, 9am to 9pm IST',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      content: '123 Spiritual Lane, Mumbai',
      description: 'Maharashtra 400001, India',
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: '9:00 AM - 9:00 PM',
      description: 'Monday to Saturday',
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-primary to-secondary overflow-hidden">
        <ConstellationBg starCount={50} opacity={0.1} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-5xl font-bold text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-white/80">
              Have questions? We'd love to hear from you. Send us a message and we'll
              respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="bg-background-card rounded-2xl p-6 shadow-lg shadow-[hsl(var(--primary))]/5 text-center card-hover"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary mb-2">
                  {info.title}
                </h3>
                <p className="text-primary font-medium mb-1">{info.content}</p>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-background-card rounded-2xl p-8 shadow-lg shadow-[hsl(var(--primary))]/5">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-primary mb-4">
                    Message Sent!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <Button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: '',
                      });
                    }}
                    className="btn-primary"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-serif text-2xl font-bold text-primary mb-6">
                    Send us a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-primary font-medium">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-primary font-medium">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-primary font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-primary font-medium">
                          Subject <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="How can we help?"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="py-6 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-primary font-medium">
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your query..."
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={6}
                        className="border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20 resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-6"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              {/* Map Placeholder */}
              <div className="bg-background-card rounded-2xl p-2 shadow-lg shadow-[hsl(var(--primary))]/5 h-80">
                <div className="w-full h-full bg-gradient-to-br from-background-elevated to-background-card rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Interactive Map</p>
                    <p className="text-sm text-muted-foreground">Mumbai, Maharashtra, India</p>
                  </div>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="bg-background-card rounded-2xl p-8 shadow-lg shadow-[hsl(var(--primary))]/5">
                <h3 className="font-serif text-xl font-bold text-primary mb-4">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {[
                    'How do I book a consultation?',
                    'What payment methods are accepted?',
                    'Can I reschedule my appointment?',
                    'How accurate are the predictions?',
                  ].map((question) => (
                    <div
                      key={question}
                      className="p-4 bg-background-elevated rounded-xl hover:bg-background-card cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-medium text-primary">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
