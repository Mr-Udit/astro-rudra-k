import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Upload, X, Plus, Loader2, ArrowLeft } from 'lucide-react';
import apiClient from '../api/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10,15}$/;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface FormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  experienceYears: string;
  title: string;
  skills: string[];
  languages: string[];
  availability: Array<{ day: string; startTime: string; endTime: string }>;
  bio: string;
}

export default function CreateAstrologerForm() {
  useDocumentTitle('Create Astrologer');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phoneNumber: '',
    experienceYears: '',
    skills: [''],
    availability: [{ day: 'Monday', startTime: '', endTime: '' }],
    bio: '',
    title: '',
    languages: [''],
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateSkill = (index: number, value: string) => {
    const skills = [...form.skills];
    skills[index] = value;
    setForm({ ...form, skills });
  };

  const addSkill = () => {
    setForm({ ...form, skills: [...form.skills, ''] });
  };

  const removeSkill = (index: number) => {
    setForm({ ...form, skills: form.skills.filter((_, i) => i !== index) });
  };

  const updateAvailability = (index: number, field: 'day' | 'startTime' | 'endTime', value: string) => {
    const availability = [...form.availability];
    availability[index][field] = value;
    setForm({ ...form, availability });
  };

  const addAvailability = () => {
    setForm({
      ...form,
      availability: [...form.availability, { day: 'Monday', startTime: '', endTime: '' }],
    });
  };

  const removeAvailability = (index: number) => {
    setForm({ ...form, availability: form.availability.filter((_, i) => i !== index) });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!profileImage) return null;
    
    try {
      // Get signature from backend
      const sigRes = await apiClient.get('/api/cloudinary/signature');
      const { signature, timestamp, cloudName, apiKey } = sigRes.data.data;
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', profileImage);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      
      const uploadRes = await fetch(
        `${import.meta.env.VITE_CLOUDINARY_UPLOAD_BASE}/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const data = await uploadRes.json();
      return data.secure_url;
    } catch (err) {
      console.error('Image upload failed:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validation
    if (form.fullName.trim().length < 3) {
      alert('Full name must be at least 3 characters');
      return;
    }
    if (!EMAIL_REGEX.test(form.email)) {
      alert('Please enter a valid email address');
      return;
    }
    if (!PHONE_REGEX.test(form.phoneNumber)) {
      alert('Phone number must be 10-15 digits');
      return;
    }
    if (form.title.trim().length === 0) {
      alert('Please provide a title');
      return;
    }
    const skills = form.skills.map(s => s.trim()).filter(Boolean);
    if (skills.length === 0) {
      alert('Please specify at least one skill');
      return;
    }
    const languages = form.languages.map(l => l.trim()).filter(Boolean);
    if (languages.length === 0) {
      alert('Please specify at least one language');
      return;
    }
    if (!form.experienceYears || isNaN(Number(form.experienceYears)) || Number(form.experienceYears) < 0) {
      alert('Experience years must be a valid number');
      return;
    }

    setSubmitting(true);
    try {
      // Upload image first
      const imageUrl = await uploadImage();
      
      // Create astrologer
      const payload = {
        fullName: form.fullName,
        title: form.title,
        email: form.email,
        phoneNumber: form.phoneNumber,
        experienceYears: Number(form.experienceYears),
        skills,
        languages,
        availability: form.availability,
        bio: form.bio,
        profileImage: imageUrl,
      };
      
      await apiClient.post('/astrologers/create', payload);
      alert('Astrologer created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      let msg = err.response?.data?.message || err.response?.data?.error?.message;
      if (status === 422) {
        const details: string[] = err.response?.data?.error?.details || [];
        msg = details.join(', ') || msg || 'Invalid form data';
        console.error('Validation failed:', details);
      }
      console.error('Failed to create astrologer:', err);
      alert(msg || 'Failed to create astrologer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Navbar */}
      <nav className="py-4 px-4 sm:px-6 lg:px-8 bg-white sticky top-0 z-50"
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
          <Link to="/dashboard" className="btn-secondary text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--deep-indigo)' }}>
            Create New Astrologer
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
            Fill in the details to add a new astrologer to the platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div>
              <label htmlFor="profile-image" className="block text-sm font-medium mb-2">Profile Image</label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ borderColor: previewUrl ? 'transparent' : '#E5E5EA' }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <input
                id="profile-image"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="astro-full-name" className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  id="astro-full-name"
                  type="text"
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label htmlFor="astro-email" className="block text-sm font-medium mb-2">Email *</label>
                <input
                  id="astro-email"
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label htmlFor="astro-phone" className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  id="astro-phone"
                  type="tel"
                  name="phoneNumber"
                  required
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label htmlFor="astro-title" className="block text-sm font-medium mb-2">Title *</label>
                <input
                  id="astro-title"
                  type="text"
                  name="title"
                  required
                  value={form.title}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Vedic Astrologer"
                />
              </div>
              <div>
                <label htmlFor="astro-experience" className="block text-sm font-medium mb-2">Experience (Years) *</label>
                <input
                  id="astro-experience"
                  type="number"
                  name="experienceYears"
                  required
                  min="0"
                  value={form.experienceYears}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="5"
                />
              </div>
              <div>
                <label htmlFor="astro-languages" className="block text-sm font-medium mb-2">Languages</label>
                <input
                  id="astro-languages"
                  type="text"
                  name="languages"
                  value={form.languages.join(', ')}
                  onChange={(e) => setForm({ ...form, languages: e.target.value.split(',') })}
                  className="form-input"
                  placeholder="Hindi, English"
                />
                <p className="text-xs text-gray-500 mt-1">Separate languages with commas</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="astro-bio" className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                id="astro-bio"
                name="bio"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                className="form-input"
                placeholder="Brief description about the astrologer..."
              />
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skill-0" className="block text-sm font-medium mb-2">Skills/Specializations</label>
              <div className="space-y-3">
                {form.skills.map((skill, index) => (
                  <div key={skill} className="flex items-center gap-2">
                    <input
                      id={index === 0 ? 'skill-0' : undefined}
                      type="text"
                      value={skill}
                      onChange={(e) => updateSkill(index, e.target.value)}
                      className="form-input flex-1"
                      placeholder="e.g., Vedic Astrology, Numerology"
                    />
                    {form.skills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSkill}
                className="btn-secondary mt-3 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>

            {/* Availability */}
            <div>
              <label htmlFor="avail-day-0" className="block text-sm font-medium mb-2">Availability Schedule</label>
              <div className="space-y-3">
                {form.availability.map((slot, index) => (
                  <div key={slot.day} className="flex items-center gap-3">
                    <select
                      id={index === 0 ? 'avail-day-0' : undefined}
                      value={slot.day}
                      onChange={(e) => updateAvailability(index, 'day', e.target.value)}
                      className="form-input flex-1"
                    >
                      {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateAvailability(index, 'startTime', e.target.value)}
                      className="form-input w-32"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateAvailability(index, 'endTime', e.target.value)}
                      className="form-input w-32"
                    />
                    {form.availability.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAvailability(index)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addAvailability}
                className="btn-secondary mt-3 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Time Slot
              </button>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Astrologer'
                )}
              </button>
              <Link to="/dashboard" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </m.div>
      </div>
    </div>
    </LazyMotion>
  );
}
