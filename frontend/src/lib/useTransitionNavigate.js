import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';

// Wraps react-router's navigate() in the native View Transitions API when the
// browser supports it, so moving between pages (Landing -> Projects/Skills/
// Contact, category -> case study, etc.) gets a real animated cross-fade
// instead of an instant swap. flushSync forces React to commit the new page
// synchronously inside the transition callback — without it the browser
// would snapshot the same "before" DOM twice and nothing would animate.
// Falls back to a plain navigate() in browsers without support (e.g. Firefox).
export function useTransitionNavigate() {
  const navigate = useNavigate();

  return (to, options) => {
    if (!document.startViewTransition) {
      navigate(to, options);
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => navigate(to, options));
    });
  };
}
