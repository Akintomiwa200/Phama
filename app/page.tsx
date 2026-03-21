'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Shield,
  Users,
  Building2,
  Stethoscope,
  Sparkles,
  ShoppingCart,
  FileText,
  Scan,
  Menu,
  X,
  CheckCircle,
  Clock,
  Truck,
  Heart,
  Brain,
  Globe,
  ChevronRight,
  Star,
  Award,
  Zap,
  Lock,
  BarChart,
  Activity,
  Phone,
  Mail,
  MapPin,
  Play,
  TrendingUp,
  Package,
  Receipt,
  Calendar,
  MessageSquare,
  Video,
  Download,
  ExternalLink,
  CreditCard,
  Settings,
  UserCircle,
  Pill,
  AlertCircle,
  ThumbsUp,
  Globe2,
  Smartphone,
  Laptop,
  Twitter,
  Linkedin,
  Facebook,
  Github
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative bg-white">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-200 transition-shadow">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">pharma<span className="text-emerald-600">connect</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {['Platform', 'Solutions', 'Resources', 'Pricing'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-gray-600 hover:text-emerald-600 transition-colors text-sm font-medium"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Get started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg"
          >
            <div className="px-4 py-4 space-y-2">
              {['Platform', 'Solutions', 'Resources', 'Pricing'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-2 text-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Healthcare Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-5xl mx-auto">
              The future of
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> pharmacy management </span>
              is here
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect wholesalers, pharmacies, providers, and patients in one seamless platform. 
              Reduce costs, improve outcomes, and transform healthcare delivery.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Start free trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 font-semibold text-gray-700">
                <Play className="w-5 h-5" />
                Watch demo
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-600">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-600">HIPAA compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-600">14-day free trial</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted Companies */}
      <div className="border-t border-b border-gray-100 bg-gray-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm uppercase tracking-wider mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {['CVS Health', 'Walgreens', 'Rite Aid', 'Kaiser Permanente', 'Mayo Clinic'].map((company) => (
              <span key={company} className="text-lg font-semibold text-gray-400">{company}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50,000+', label: 'Active pharmacies', icon: Building2 },
              { value: '2.5M+', label: 'Prescriptions/month', icon: FileText },
              { value: '98%', label: 'Customer satisfaction', icon: ThumbsUp },
              { value: '24/7', label: 'Support available', icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">The platform</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Everything you need in one place</h2>
            <p className="text-xl text-gray-600">A unified ecosystem designed for modern healthcare delivery</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: 'For Wholesalers',
                description: 'Streamline distribution with predictive inventory and automated fulfillment.',
                icon: Package,
                features: ['Demand forecasting', 'Route optimization', 'Real-time tracking']
              },
              {
                title: 'For Pharmacies',
                description: 'Manage prescriptions, inventory, and customer relationships effortlessly.',
                icon: ShoppingCart,
                features: ['POS integration', 'Inventory alerts', 'Customer profiles']
              },
              {
                title: 'For Providers',
                description: 'E-prescribe, access patient history, and collaborate seamlessly.',
                icon: Stethoscope,
                features: ['E-prescribing', 'Drug interaction checks', 'Patient records']
              },
              {
                title: 'For Patients',
                description: 'Take control of your health journey with digital tools.',
                icon: Heart,
                features: ['Medication reminders', 'Refill requests', 'Telehealth']
              },
              {
                title: 'For Payers',
                description: 'Reduce costs and improve outcomes with data-driven insights.',
                icon: TrendingUp,
                features: ['Claims processing', 'Utilization review', 'Cost analytics']
              },
              {
                title: 'For Administrators',
                description: 'Manage users, permissions, and compliance from one dashboard.',
                icon: Settings,
                features: ['Role-based access', 'Audit logs', 'Compliance tools']
              }
            ].map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <ul className="space-y-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Powerful tools for modern healthcare</h2>
            <p className="text-xl text-gray-600">Everything you need to deliver exceptional care</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Scan,
                title: 'AI Drug Scanner',
                description: 'Instant medication identification, authenticity verification, and safety information.',
                badge: 'New'
              },
              {
                icon: BarChart,
                title: 'Predictive Analytics',
                description: 'Forecast demand, optimize inventory, and reduce waste with AI-powered predictions.',
                badge: 'AI'
              },
              {
                icon: Activity,
                title: 'Real-time Tracking',
                description: 'Monitor inventory, orders, and deliveries across your entire network.',
                badge: ''
              },
              {
                icon: MessageSquare,
                title: 'Secure Messaging',
                description: 'HIPAA-compliant communication between providers, pharmacies, and patients.',
                badge: 'Secure'
              },
              {
                icon: FileText,
                title: 'Digital Prescriptions',
                description: 'Paperless prescribing with e-signatures, audit trails, and error checking.',
                badge: ''
              },
              {
                icon: Shield,
                title: 'Compliance Tools',
                description: 'Built-in compliance with HIPAA, GDPR, and state pharmacy regulations.',
                badge: 'Enterprise'
              }
            ].map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4 }}
                className="group relative bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                {feature.badge && (
                  <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    {feature.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Integrations</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Connect with your existing tools</h2>
              <p className="text-lg text-gray-600 mb-6">
                PharmaConnect integrates seamlessly with the tools you already use, making adoption effortless.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {['EHR Systems', 'Billing Software', 'Inventory Systems', 'Telehealth Platforms', 'Accounting Tools', 'CRM Systems'].map((integration) => (
                  <div key={integration} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-gray-700 text-sm">{integration}</span>
                  </div>
                ))}
              </div>
              <Link href="/integrations" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all">
                View all integrations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-2xl opacity-20" />
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="grid grid-cols-3 gap-6">
                  {['Epic', 'Cerner', 'Allscripts', 'QuickBooks', 'Salesforce', 'Slack'].map((tool) => (
                    <div key={tool} className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Globe2 className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">{tool}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Loved by healthcare professionals</h2>
            <p className="text-xl text-gray-600">See what our customers are saying about PharmaConnect</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "PharmaConnect has transformed our pharmacy operations. The AI scanner alone saves us 15+ hours per week.",
                author: "Dr. Sarah Johnson",
                role: "Clinical Pharmacist",
                rating: 5
              },
              {
                quote: "Inventory management has never been easier. We've reduced waste by 40% and improved fill rates significantly.",
                author: "Michael Chen",
                role: "Pharmacy Owner",
                rating: 5
              },
              {
                quote: "The integration with our EHR was seamless. Our providers love the e-prescribing functionality.",
                author: "Dr. Emily Rodriguez",
                role: "Healthcare System Director",
                rating: 5
              }
            ].map((testimonial) => (
              <div key={testimonial.author} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your needs. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$99",
                period: "/month",
                description: "Perfect for independent pharmacies",
                features: ["Up to 500 prescriptions/month", "Basic analytics", "Email support", "Inventory tracking", "Single location"]
              },
              {
                name: "Professional",
                price: "$299",
                period: "/month",
                description: "Best for growing practices",
                features: ["Unlimited prescriptions", "Advanced analytics", "Priority support", "API access", "AI drug scanner", "Multi-location support"],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                description: "For large healthcare systems",
                features: ["Custom integrations", "Dedicated account manager", "SLA guarantee", "On-premise deployment", "24/7 phone support", "Custom reporting"]
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    Most popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg' : 'border-2 border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600'}`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to transform your pharmacy?</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals already using PharmaConnect to improve patient care and streamline operations.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-600 font-semibold hover:shadow-xl transition-all"
            >
              Start free trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-all"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl text-white">pharmaconnect</span>
              </div>
              <p className="text-sm mb-4">Modernizing pharmacy operations with intelligent technology.</p>
              <div className="flex gap-4">
                <Link href="#" className="hover:text-white transition-colors"><Twitter className="w-4 h-4" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Github className="w-4 h-4" /></Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2024 PharmaConnect. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
              <Link href="#" className="hover:text-white transition-colors">Licenses</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}