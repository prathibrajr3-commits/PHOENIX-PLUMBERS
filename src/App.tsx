/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Droplets, 
  Wrench, 
  Clock, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Menu, 
  X, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  serverTimestamp,
  getDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { Booking, Review, Service } from './types';
import { generatePlumbingImage, getNearbyPlumbingInfo } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

// --- Constants ---
const BUSINESS_NAME = "Phoenix Plumbers & Drain Clean Services";
const PHONE_NUMBER = "073730 73835";
const WHATSAPP_NUMBER = "917373073835"; // International format
const ADDRESS = "39A, Gin Factory Rd, Shanmugapuram, Thoothukudi, Tamil Nadu 628002";

const SERVICES: Service[] = [
  { id: 'drain', title: 'Drain Cleaning', description: 'Expert removal of stubborn clogs and deep cleaning of drainage systems.', icon: 'Droplets' },
  { id: 'leak', title: 'Pipe Leak Repair', description: 'Fast detection and repair of leaking pipes to prevent water damage.', icon: 'Wrench' },
  { id: 'bathroom', title: 'Bathroom Plumbing', description: 'Installation and repair of toilets, showers, and bathroom fixtures.', icon: 'Droplets' },
  { id: 'kitchen', title: 'Kitchen Plumbing', description: 'Sink repairs, dishwasher installations, and garbage disposal maintenance.', icon: 'Wrench' },
  { id: 'tank', title: 'Water Tank Installation', description: 'Professional setup and maintenance of overhead and underground tanks.', icon: 'Droplets' },
  { id: 'emergency', title: 'Emergency Plumbing', description: '24/7 rapid response for urgent plumbing crises.', icon: 'Clock' },
];

const REVIEWS_MOCK = [
  { id: '1', displayName: 'Arun Kumar', rating: 5, comment: 'Excellent service! They arrived within 30 minutes for a major leak.', createdAt: new Date().toISOString() },
  { id: '2', displayName: 'Priya S.', rating: 4, comment: 'Very professional technicians. Fixed my kitchen sink perfectly.', createdAt: new Date().toISOString() },
  { id: '3', displayName: 'Muthu R.', rating: 5, comment: 'Best plumbing service in Thoothukudi. Highly recommended.', createdAt: new Date().toISOString() },
];

// --- Components ---

const Navbar = ({ user, onLogin, onLogout }: { user: FirebaseUser | null, onLogin: () => void, onLogout: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      isScrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <Droplets className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-white hidden md:block">
            PHOENIX <span className="text-orange-500">PLUMBERS</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Services', 'Why Us', 'Reviews', 'AI Visualizer', 'Contact'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(' ', '-')}`} 
              className="text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors"
            >
              {item}
            </a>
          ))}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{user.email}</span>
                <button onClick={onLogout} className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2">
                  <LogOut size={16} /> Logout
                </button>
              </div>
              <div className="lg:hidden">
                <button onClick={onLogout} className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2">
                  <LogOut size={16} /> Logout
                </button>
              </div>
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-orange-500" />
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-sm font-semibold transition-all flex items-center gap-2"
            >
              <User size={16} /> Login
            </button>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black border-b border-white/10 p-6 flex flex-col gap-4 md:hidden"
          >
            {['Services', 'Why Us', 'Reviews', 'AI Visualizer', 'Contact'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-gray-300"
              >
                {item}
              </a>
            ))}
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                  <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-orange-500" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-gray-500 font-mono truncate">{user.email}</span>
                    <span className="text-sm font-bold text-white truncate">{user.displayName}</span>
                  </div>
                </div>
                <button onClick={onLogout} className="text-lg font-medium text-orange-500 flex items-center gap-2">
                  <LogOut size={20} /> Logout
                </button>
              </div>
            ) : (
              <button onClick={onLogin} className="text-lg font-medium text-orange-500 flex items-center gap-2">
                <User size={20} /> Login
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onBook }: { onBook: (service: string) => void }) => {
  const [heroImg, setHeroImg] = useState<string | null>(null);

  useEffect(() => {
    const loadImg = async () => {
      try {
        const img = await generatePlumbingImage("Professional plumber fixing a sink drain in a modern kitchen, cinematic lighting, high quality");
        if (img) setHeroImg(img);
      } catch (error) {
        console.error("Hero image generation failed:", error);
      }
    };
    loadImg();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImg || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80"} 
          alt="Plumbing Service" 
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/20 border border-orange-600/30 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6">
            <Clock size={14} /> 24/7 Emergency Service
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Fast & Reliable <br />
            <span className="text-orange-500">Plumbing Services</span> <br />
            in Thoothukudi
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-lg">
            Expert drain cleaning, pipe repairs, and emergency plumbing. We are your local professionals dedicated to keeping your home flowing smoothly.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onBook('drain')}
              className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
            >
              <Calendar size={20} /> Request Service
            </button>
            <a 
              href={`tel:${PHONE_NUMBER}`}
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Phone size={20} /> Call Now
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hidden lg:block relative"
        >
          <div className="absolute -inset-4 bg-orange-600/20 blur-3xl rounded-full" />
          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">4.1</div>
              <div>
                <div className="flex text-orange-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />)}
                </div>
                <p className="text-sm text-gray-400">Trusted by 6000+ Customers</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="text-orange-500" size={20} />
                <span>Certified Technicians</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="text-orange-500" size={20} />
                <span>Affordable Pricing</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="text-orange-500" size={20} />
                <span>Modern Equipment</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Services = ({ onBook }: { onBook: (service: string) => void }) => {
  return (
    <section id="services" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Our Professional Services</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From minor repairs to major installations, we provide comprehensive plumbing solutions for residential and commercial properties.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 bg-zinc-900 border border-white/5 rounded-3xl hover:border-orange-600/50 transition-all"
            >
              <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
                {service.icon === 'Droplets' ? <Droplets size={32} /> : service.icon === 'Wrench' ? <Wrench size={32} /> : <Clock size={32} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{service.description}</p>
              <button 
                onClick={() => onBook(service.title)}
                className="flex items-center gap-2 text-orange-500 font-bold hover:gap-3 transition-all"
              >
                Book Service <ArrowRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyChooseUs = () => {
  const features = [
    { title: "24/7 Emergency Service", icon: Clock },
    { title: "Experienced Technicians", icon: ShieldCheck },
    { title: "Fast Response Time", icon: Clock },
    { title: "Affordable Pricing", icon: Star },
    { title: "Trusted by Local Customers", icon: ShieldCheck },
    { title: "Professional Equipment", icon: Wrench },
  ];

  return (
    <section id="why-us" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">Why Thoothukudi Trusts Phoenix Plumbers?</h2>
            <p className="text-gray-400 mb-10 leading-relaxed">
              We understand that plumbing issues can be stressful. That's why we've built our reputation on reliability, transparency, and superior craftsmanship.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center text-orange-500">
                    <f.icon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">{f.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80" 
                alt="Plumber Working" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-orange-600 p-8 rounded-3xl shadow-xl">
              <p className="text-4xl font-bold text-white mb-1">10+</p>
              <p className="text-sm font-medium text-orange-100">Years of Excellence</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AIVisualizer = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const img = await generatePlumbingImage(prompt);
      if (img) {
        setGeneratedImg(img);
      } else {
        setError("Failed to generate image. Please try a different prompt.");
      }
    } catch (err: any) {
      console.error("Generation failed:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setError("Permission denied. The API key might not have access to image generation.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-visualizer" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/20 border border-orange-600/30 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6">
              AI Powered
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">AI Plumbing Visualizer</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Describe your plumbing issue or a dream bathroom renovation, and our AI will generate a high-quality visualization for you.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Describe what you want to see</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-orange-600 outline-none transition-all h-32 resize-none" 
                  placeholder="e.g., A modern luxury bathroom with a gold-finished shower head and marble tiles..." 
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Droplets size={20} /> Generate Visualization
                  </>
                )}
              </button>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-500 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 flex items-center justify-center">
            {generatedImg ? (
              <motion.img 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={generatedImg} 
                alt="AI Generated Visualization" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center p-12">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-600 mx-auto mb-6">
                  <Droplets size={40} />
                </div>
                <p className="text-gray-500 font-medium">Your AI visualization will appear here</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-bold">Dreaming up your image...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Reviews = () => {
  return (
    <section id="reviews" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Customer Testimonials</h2>
          <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
          </div>
          <p className="text-gray-400">⭐ 4.1 Rating from 6000+ customers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {REVIEWS_MOCK.map((review) => (
            <div key={review.id} className="p-8 bg-zinc-900 rounded-3xl border border-white/5">
              <div className="flex text-orange-500 mb-4">
                {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-300 italic mb-6">"{review.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  {review.displayName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{review.displayName}</p>
                  <p className="text-xs text-gray-500">Verified Customer</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = ({ user, selectedService, onServiceChange }: { 
  user: FirebaseUser | null, 
  selectedService: string,
  onServiceChange: (service: string) => void
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localInsights, setLocalInsights] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const fetchInsights = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const info = await getNearbyPlumbingInfo(pos.coords.latitude, pos.coords.longitude);
            setLocalInsights(info);
          } catch (e) {
            console.error("Failed to fetch local insights:", e);
          }
        });
      }
    };
    fetchInsights();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        uid: user.uid,
        displayName: formData.name,
        phone: formData.phone,
        serviceType: selectedService,
        address: formData.address,
        notes: formData.notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Send confirmation email via backend
      try {
        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: formData.name,
            service: selectedService,
            address: formData.address,
            phone: formData.phone
          })
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // We don't block the success state if email fails
      }

      setSuccess(true);
      setFormData({ name: '', phone: '', address: '', notes: '' });
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-bold text-white mb-8">Get In Touch</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">Our Location</h4>
                  <p className="text-gray-400">{ADDRESS}</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">Call Us</h4>
                  <p className="text-gray-400">{PHONE_NUMBER}</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">WhatsApp</h4>
                  <p className="text-gray-400">Available 24/7 for emergencies</p>
                </div>
              </div>
            </div>

            {localInsights && (
              <div className="mt-12 p-6 bg-zinc-900/50 border border-orange-600/20 rounded-3xl">
                <h4 className="text-orange-500 font-bold mb-3 flex items-center gap-2">
                  <Star size={16} /> Local Plumbing Insights
                </h4>
                <div className="text-sm text-gray-400 leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown>{localInsights}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="mt-12 h-64 rounded-3xl overflow-hidden border border-white/10">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3943.518683510524!2d78.1404163!3d8.8124444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b03f0f7f7f7f7f7%3A0x7f7f7f7f7f7f7f7f!2s39A%2C%20Gin%20Factory%20Rd%2C%20Shanmugapuram%2C%20Thoothukudi%2C%20Tamil%20Nadu%20628002!5e0!3m2!1sen!2sin!4v1710500000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="bg-zinc-900 p-8 md:p-12 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Request a Service</h3>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-emerald-600/10 text-emerald-500 text-[10px] font-bold rounded border border-emerald-600/20 uppercase tracking-wider">Secure</div>
                <div className="px-2 py-1 bg-orange-600/10 text-orange-500 text-[10px] font-bold rounded border border-orange-600/20 uppercase tracking-wider">Fast Response</div>
              </div>
            </div>
            {success ? (
              <div className="bg-emerald-600/20 border border-emerald-600/30 p-8 rounded-2xl text-center">
                <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
                <h4 className="text-xl font-bold text-white mb-2">Request Submitted!</h4>
                <p className="text-gray-400 mb-6">We'll contact you shortly to confirm your booking.</p>
                <button onClick={() => setSuccess(false)} className="text-orange-500 font-bold">Submit another request</button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-600 outline-none transition-all" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-600 outline-none transition-all" 
                      placeholder="+91 00000 00000" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Service Type</label>
                  <select 
                    value={selectedService}
                    onChange={(e) => onServiceChange(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-600 outline-none transition-all"
                  >
                    {SERVICES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Address</label>
                  <textarea 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-600 outline-none transition-all h-32" 
                    placeholder="Your full address in Thoothukudi" 
                  />
                </div>
                <button 
                  disabled={loading || !user}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20"
                >
                  {loading ? "Submitting..." : user ? "Submit Request" : "Login to Request Service"}
                </button>
                {!user && (
                  <p className="text-center text-xs text-gray-500 mt-4">
                    You must be logged in to track your service requests.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-zinc-950 pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Droplets className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                PHOENIX <span className="text-orange-500">PLUMBERS</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6">
              Providing premium plumbing and drain cleaning services in Thoothukudi. Trustworthy, professional, and always on time.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition-all"><Phone size={20} /></a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white transition-all"><MessageCircle size={20} /></a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#services" className="hover:text-orange-500 transition-colors">Services</a></li>
              <li><a href="#why-us" className="hover:text-orange-500 transition-colors">Why Choose Us</a></li>
              <li><a href="#reviews" className="hover:text-orange-500 transition-colors">Reviews</a></li>
              <li><a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Contact Info</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-orange-500 shrink-0" />
                <span>{ADDRESS}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-orange-500" />
                <span>{PHONE_NUMBER}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-12 border-t border-white/5 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const FloatingButtons = ({ onBook }: { onBook: (service: string) => void }) => {
  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onBook('drain')}
          className="w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-700 transition-all"
        >
          <Calendar size={28} />
        </motion.button>
        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-all"
        >
          <MessageCircle size={28} />
        </motion.a>
      </div>
      
      {/* Mobile Sticky Call Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/80 backdrop-blur-md border-t border-white/10 p-4 flex gap-4">
        <a 
          href={`tel:${PHONE_NUMBER}`}
          className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Phone size={18} /> Call Now
        </a>
        <a 
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} /> WhatsApp
        </a>
      </div>
    </>
  );
};

// --- Main App ---

const MyBookings = ({ user }: { user: FirebaseUser }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });
    return () => unsubscribe();
  }, [user]);

  if (bookings.length === 0) return null;

  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white mb-8">My Service Requests</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((b) => (
            <div key={b.id} className="p-6 bg-zinc-900 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-orange-600/20 text-orange-500 text-xs font-bold rounded-full uppercase">
                  {b.status}
                </span>
                <span className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">{b.serviceType}</h4>
              <p className="text-sm text-gray-400 mb-4">{b.address}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone size={12} /> {b.phone}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedService, setSelectedService] = useState('drain');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'client'
          });
        }
      }
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleBookService = (serviceId: string) => {
    const service = SERVICES.find(s => s.id === serviceId || s.title === serviceId);
    if (service) {
      setSelectedService(service.id);
    }
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-black text-white selection:bg-orange-600 selection:text-white">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <main>
        <Hero onBook={handleBookService} />
        
        <section className="bg-orange-600 py-12 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-2xl font-black text-white/20 uppercase tracking-tighter mx-8">
                Emergency Plumbing • Drain Cleaning • Pipe Repair • Water Tank • 24/7 Service • 
              </span>
            ))}
          </div>
        </section>

        {user && <MyBookings user={user} />}

        <Services onBook={handleBookService} />
        <WhyChooseUs />
        <AIVisualizer />
        
        <section className="py-24 bg-orange-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Need a plumber right now?</h2>
            <p className="text-orange-100 text-lg mb-10 max-w-2xl mx-auto">
              Don't wait for the leak to get worse. Our expert team is ready to help you 24 hours a day, 7 days a week.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={`tel:${PHONE_NUMBER}`} className="px-10 py-4 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-xl">
                Call Now: {PHONE_NUMBER}
              </a>
              <button 
                onClick={() => handleBookService('Emergency')}
                className="px-10 py-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-900 transition-all shadow-xl"
              >
                Request Service
              </button>
            </div>
          </div>
        </section>

        <Reviews />
        <Contact 
          user={user} 
          selectedService={selectedService} 
          onServiceChange={setSelectedService} 
        />
      </main>

      <Footer />
      <FloatingButtons onBook={handleBookService} />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
