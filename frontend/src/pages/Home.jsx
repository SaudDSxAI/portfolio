import Hero from '../components/Hero';

// The landing page is a single, no-scroll view — intro, photo, and about
// info all live inside Hero. Projects, Skills, and Contact are separate
// routes (see App.jsx) reached via the buttons on this page.
export default function Home() {
  return <Hero />;
}
