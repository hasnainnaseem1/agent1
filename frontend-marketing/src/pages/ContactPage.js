import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, MessageSquare, Send, CheckCircle, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import config from '../config';

function ContactPage() {
  const { site } = useSite();
  const brandName = site.companyName || site.siteName || 'Sellsera';
  const contactEmail = site.contactEmail || site.supportEmail || '';

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    // In production, connect to your backend contact endpoint
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 5000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const FAQ = [
    { q: 'How quickly do you respond?', a: 'We typically respond within 24 hours on business days. Urgent issues are often resolved much faster.' },
    { q: 'Do you offer live chat support?', a: 'Live chat is coming soon! For now, email is the fastest way to reach us.' },
    { q: "I can't log in to my account. What do I do?", a: 'Use the "Forgot Password" link on the login page. If that doesn\'t work, email us with your account email and we\'ll sort it out quickly.' },
    { q: 'How do I cancel my subscription?', a: 'You can cancel anytime from your account settings. If you need help, just email us and we\'ll handle it for you.' },
  ];

  return (
    <div className="bg-white overflow-x-hidden min-h-screen">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-8">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-semibold">We're Here to Help</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">Get in Touch</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Have a question about {brandName}? Need help with your account? We'd love to hear from you.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full fill-white">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* ── LEFT: Contact Form ── */}
            <div className="lg:col-span-3">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-500 mb-8">Fill out the form and we'll get back to you within 24 hours.</p>

              {submitted ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Message Sent!</h3>
                  <p className="text-green-600">Thank you! We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name <span className="text-red-500">*</span></label>
                      <input
                        type="text" name="name" value={formData.name} onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl outline-none transition focus:ring-2 focus:ring-purple-400 focus:border-transparent ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Jane Smith"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email" name="email" value={formData.email} onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl outline-none transition focus:ring-2 focus:ring-purple-400 focus:border-transparent ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="jane@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                    <input
                      type="text" name="subject" value={formData.subject} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message <span className="text-red-500">*</span></label>
                    <textarea
                      name="message" value={formData.message} onChange={handleChange} rows={6}
                      className={`w-full px-4 py-3 border rounded-xl outline-none transition focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Tell us more about how we can help you..."
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200"
                  >
                    {submitting ? (
                      <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending...</>
                    ) : (
                      <><Send className="w-5 h-5" />Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ── RIGHT: Contact Info + FAQ ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Email card */}
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
                    <p className="text-gray-500 text-sm mb-2">We'll respond within 24 hours on business days.</p>
                    {contactEmail ? (
                      <a href={`mailto:${contactEmail}`} className="text-purple-600 font-semibold hover:underline text-sm">
                        {contactEmail}
                      </a>
                    ) : (
                      <span className="text-purple-600 font-semibold text-sm">Available via contact form</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Response time card */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Response Time</h3>
                    <p className="text-gray-500 text-sm">Monday – Friday, 9am – 6pm EST</p>
                    <p className="text-blue-600 font-semibold text-sm mt-1">Usually within a few hours</p>
                  </div>
                </div>
              </div>

              {/* Live chat coming soon */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
                    <p className="text-gray-500 text-sm">Real-time chat with our team.</p>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Quick FAQ */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  Quick Answers
                </h3>
                <div className="space-y-4">
                  {FAQ.map((item, i) => (
                    <div key={i}>
                      <p className="font-semibold text-gray-900 text-sm mb-1">{item.q}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <Link to="/pricing" className="text-purple-600 font-semibold text-sm hover:underline flex items-center gap-1">
                    View pricing FAQ <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-purple-700 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to grow your Etsy shop?</h2>
          <p className="text-blue-100 mb-8 text-lg">Get started for free — no credit card required.</p>
          <a
            href={`${config.customerCenterUrl}/signup`}
            className="group inline-flex items-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-xl"
          >
            Start for Free
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ContactPage;
