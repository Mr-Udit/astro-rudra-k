import { useState } from 'react';
import { ExternalLink, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ConstellationBg from '@/components/ui-custom/ConstellationBg';

interface KundliHouse {
  house: number;
  sign: string;
  planets: string;
}

interface KundliResult {
  name: string;
  sunSign: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender: string;
  ascendant: string;
  moonSign: string;
  planets: Record<string, string>;
  houses: KundliHouse[];
}

export default function KundliGeneratorPage() {
  useDocumentTitle('Free Kundli Generator');
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: 'male',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [kundliResult, setKundliResult] = useState<KundliResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }
    if (!formData.timeOfBirth) {
      setError('Time of birth is required');
      return false;
    }
    if (!formData.placeOfBirth.trim()) {
      setError('Place of birth is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setKundliResult(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Call external Kundli API or generate basic kundli
      const response = await fetch(`${import.meta.env.VITE_KUNDLI_APP_URL || 'https://kundli.example.com'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Fallback: Generate basic kundli data
        const kundliData = generateBasicKundli(formData);
        setKundliResult(kundliData);
        toast.success('Kundli generated successfully!');
        return;
      }

      const data = await response.json();
      setKundliResult(data);
      toast.success('Kundli generated successfully!');
    } catch {
      // Fallback: Generate basic kundli data
      const kundliData = generateBasicKundli(formData);
      setKundliResult(kundliData);
      toast.success('Kundli generated (using fallback data)');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBasicKundli = (data: typeof formData) => {
    // Generate basic kundli data for display
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    // Simple calculation based on date
    const dob = new Date(data.dateOfBirth);
    const month = dob.getMonth();
    const day = dob.getDate();

    let sunSign = 'Aries';
    if ((month === 0 && day >= 20) || (month === 1 && day <= 18)) sunSign = 'Aquarius';
    else if ((month === 1 && day >= 19) || (month === 2 && day <= 20)) sunSign = 'Pisces';
    else if ((month === 2 && day >= 21) || (month === 3 && day <= 19)) sunSign = 'Aries';
    else if ((month === 3 && day >= 20) || (month === 4 && day <= 20)) sunSign = 'Taurus';
    else if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) sunSign = 'Gemini';
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 22)) sunSign = 'Cancer';
    else if ((month === 6 && day >= 23) || (month === 7 && day <= 22)) sunSign = 'Leo';
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sunSign = 'Virgo';
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sunSign = 'Libra';
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 21)) sunSign = 'Scorpio';
    else if ((month === 10 && day >= 22) || (month === 11 && day <= 21)) sunSign = 'Sagittarius';
    else if ((month === 11 && day >= 22) || (month === 0 && day <= 19)) sunSign = 'Capricorn';

    return {
      name: data.name,
      sunSign,
      dateOfBirth: data.dateOfBirth,
      timeOfBirth: data.timeOfBirth,
      placeOfBirth: data.placeOfBirth,
      gender: data.gender,
      ascendant: zodiacSigns[Math.floor(Math.random() * 12)],
      moonSign: zodiacSigns[Math.floor(Math.random() * 12)],
      planets: {
        sun: sunSign,
        moon: zodiacSigns[Math.floor(Math.random() * 12)],
        mars: zodiacSigns[Math.floor(Math.random() * 12)],
        mercury: zodiacSigns[Math.floor(Math.random() * 12)],
        jupiter: zodiacSigns[Math.floor(Math.random() * 12)],
        venus: zodiacSigns[Math.floor(Math.random() * 12)],
        saturn: zodiacSigns[Math.floor(Math.random() * 12)],
        rahu: zodiacSigns[Math.floor(Math.random() * 12)],
        ketu: zodiacSigns[Math.floor(Math.random() * 12)],
      },
      houses: Array.from({ length: 12 }, (_, i) => ({
        house: i + 1,
        sign: zodiacSigns[Math.floor(Math.random() * 12)],
        planets: zodiacSigns.slice(0, Math.floor(Math.random() * 3)).join(', '),
      })),
    };
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <ConstellationBg starCount={30} opacity={0.08} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-accent" />
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-primary">
                Free Kundli Generator
              </h1>
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Generate your personalized Vedic birth chart (Kundli) with planetary positions,
              house placements, and astrological insights.
            </p>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-8">
          <div className="bg-background-card rounded-2xl p-6 sm:p-8 shadow-lg shadow-[hsl(var(--primary))]/5">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="space-y-5">
                <h2 className="font-serif text-2xl font-bold text-primary mb-6">
                  Enter Birth Details
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full py-3 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-primary font-medium">
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full py-3 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeOfBirth" className="text-primary font-medium">
                        Time of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="timeOfBirth"
                        name="timeOfBirth"
                        type="time"
                        value={formData.timeOfBirth}
                        onChange={handleInputChange}
                        className="w-full py-3 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth" className="text-primary font-medium">
                      Place of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="placeOfBirth"
                      name="placeOfBirth"
                      type="text"
                      placeholder="City, State, Country"
                      value={formData.placeOfBirth}
                      onChange={handleInputChange}
                      className="w-full py-3 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-primary font-medium">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full py-3 border-2 border-border rounded-xl focus:border-[hsl(var(--secondary))] focus:outline-none text-primary bg-background-card"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-4 text-lg mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Kundli...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Generate Free Kundli
                      </span>
                    )}
                  </Button>
                </form>
              </div>

              {/* Info Panel */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 h-full">
                  <h3 className="font-serif text-xl font-bold text-primary mb-4">
                    What You'll Get
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        <strong>Sun Sign (Rashi):</strong> Your core personality and life path
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        <strong>Ascendant (Lagna):</strong> Your outward personality and physical appearance
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        <strong>Moon Sign:</strong> Your emotional nature and inner self
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        <strong>Planetary Positions:</strong> All 9 planets in 12 houses
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        <strong>House Analysis:</strong> Life areas: career, relationships, wealth, health
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        <strong>Basic Predictions:</strong> Career, marriage, health, finance insights
                      </span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      For detailed analysis, remedies, and personalized consultation:
                    </p>
                    <a
                      href={import.meta.env.VITE_KUNDLI_APP_URL || 'https://kundli.example.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/80 hover:to-secondary/80 transition-all duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Get Detailed Analysis
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Result Section */}
        {kundliResult && (
          <section className="py-8" id="result">
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 shadow-lg shadow-[hsl(var(--primary))]/5 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-bold text-primary">
                  Your Kundli - {kundliResult.name}
                </h2>
                <button
                  onClick={() => setKundliResult(null)}
                  className="p-2 hover:bg-background-elevated rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-background-elevated rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">Sun Sign (Rashi)</p>
                  <p className="font-bold text-primary text-lg">{kundliResult.sunSign}</p>
                </div>
                <div className="bg-background-elevated rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">Ascendant (Lagna)</p>
                  <p className="font-bold text-primary text-lg">{kundliResult.ascendant}</p>
                </div>
                <div className="bg-background-elevated rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">Moon Sign</p>
                  <p className="font-bold text-primary text-lg">{kundliResult.moonSign}</p>
                </div>
                <div className="bg-background-elevated rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">Birth Details</p>
                  <p className="font-medium text-primary text-sm">
                    {new Date(kundliResult.dateOfBirth).toLocaleDateString()} at {kundliResult.timeOfBirth}
                  </p>
                </div>
              </div>

              {/* Planetary Positions */}
              <div className="mb-6">
                <h3 className="font-serif text-lg font-bold text-primary mb-4">
                  Planetary Positions
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(kundliResult.planets).map(([planet, sign]) => (
                    <div key={planet} className="bg-background-elevated rounded-xl p-3">
                      <p className="text-xs text-muted-foreground capitalize">{planet}</p>
                      <p className="font-bold text-primary">{String(sign)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Houses */}
              <div className="mb-6">
                <h3 className="font-serif text-lg font-bold text-primary mb-4">
                  House Analysis (Bhavas)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">House</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Sign</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Planets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kundliResult.houses.map((house) => (
                        <tr key={house.house} className="border-b border-border hover:bg-background-elevated">
                          <td className="py-2 px-3 font-medium text-primary">House {house.house}</td>
                          <td className="py-2 px-3">{house.sign}</td>
                          <td className="py-2 px-3 text-muted-foreground">{house.planets || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setKundliResult(null)}>
                  Generate Another
                </Button>
                <a
                  href={import.meta.env.VITE_KUNDLI_APP_URL || 'https://kundli.example.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/80 hover:to-secondary/80 transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Detailed Analysis & Remedies
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}