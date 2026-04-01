import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Coaches from './components/Coaches';
import Tools from './components/Tools';
import BlogSection from './components/BlogSection';
import Plans from './components/Plans';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-red selection:text-white">
      <Navbar />
      <Hero />
      <Services />
      <Coaches />
      <Tools />
      <BlogSection />
      <Plans />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}

