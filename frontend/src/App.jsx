import React, { Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';
import SiteBackground from './components/ui/SiteBackground';

// Lazy load below-the-fold components to slash initial JS execution time
const About = React.lazy(() => import('./components/About'));
const Projects = React.lazy(() => import('./components/Projects'));
const Skills = React.lazy(() => import('./components/Skills'));
const Contact = React.lazy(() => import('./components/Contact'));

export default function App() {
  return (
    <div className="min-h-screen text-black antialiased relative">
      <SiteBackground />
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<div className="h-screen flex items-center justify-center text-zinc-500 opacity-70">Loading interface...</div>}>
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
