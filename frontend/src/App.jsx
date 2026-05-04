import React, { Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import SiteBackground from './components/ui/SiteBackground';

// Lazy load below-the-fold components to slash initial JS execution time
const About = React.lazy(() => import('./components/About'));
const Projects = React.lazy(() => import('./components/Projects'));
const Skills = React.lazy(() => import('./components/Skills'));
const Contact = React.lazy(() => import('./components/Contact'));
const ChatWidget = React.lazy(() => import('./components/ChatWidget'));

function DeferredChatWidget() {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const [initialOpen, setInitialOpen] = React.useState(false);

  React.useEffect(() => {
    const loadChat = (open = false) => {
      if (open) setInitialOpen(true);
      setShouldLoad(true);
    };

    const openHandler = () => loadChat(true);
    window.addEventListener('openChat', openHandler);

    const idleId =
      'requestIdleCallback' in window
        ? window.requestIdleCallback(() => loadChat(false), { timeout: 2500 })
        : window.setTimeout(() => loadChat(false), 1800);

    return () => {
      window.removeEventListener('openChat', openHandler);
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);

  if (!shouldLoad) {
    return (
      <button
        onClick={() => {
          setInitialOpen(true);
          setShouldLoad(true);
        }}
        className="fixed bottom-6 right-6 max-sm:hidden z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-black hover:bg-zinc-800 text-white"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <span className="absolute inset-0 rounded-full bg-black/30 animate-ping opacity-40" />
      </button>
    );
  }

  return (
    <Suspense fallback={null}>
      <ChatWidget initialOpen={initialOpen} />
    </Suspense>
  );
}

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
      <DeferredChatWidget />
    </div>
  );
}
