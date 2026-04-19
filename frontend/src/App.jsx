import React, { Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';
import EquationEngine from './components/ui/EquationEngine';

// Lazy load below-the-fold components to slash initial JS execution time
const About = React.lazy(() => import('./components/About'));
const Projects = React.lazy(() => import('./components/Projects'));
const Skills = React.lazy(() => import('./components/Skills'));
const Contact = React.lazy(() => import('./components/Contact'));

export default function App() {
  return (
    <div className="bg-dark-900 min-h-screen text-slate-200 antialiased relative">
      <EquationEngine />
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<div className="h-screen flex items-center justify-center text-slate-500 opacity-50">Loading interface...</div>}>
          <About />
          <Projects />
          <Skills />
          <Contact />
        </Suspense>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}