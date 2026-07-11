import React, { Suspense, useEffect } from 'react';
import Hero from '../components/Hero';

const About = React.lazy(() => import('../components/About'));
const Projects = React.lazy(() => import('../components/Projects'));
const Skills = React.lazy(() => import('../components/Skills'));
const Contact = React.lazy(() => import('../components/Contact'));

export default function Home() {
  // Support deep links like /#projects landing here from other pages —
  // client-side navigation doesn't auto-scroll to a hash like a fresh
  // page load would, so we do it manually once the section exists.
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      // small delay lets lazy sections mount first
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      <Hero />
      <Suspense fallback={<div className="h-screen flex items-center justify-center text-zinc-500 opacity-70">Loading interface...</div>}>
        <About />
        <Projects />
        <Skills />
        <Contact />
      </Suspense>
    </>
  );
}
