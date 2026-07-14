import { useTransitionNavigate } from '../../lib/useTransitionNavigate';

// Drop-in replacement for react-router's <Link> that animates the page swap
// via the native View Transitions API (see useTransitionNavigate). Renders a
// real <a> so it still behaves like a link (middle-click, right-click "open
// in new tab", etc. all keep working normally).
export default function TransitionLink({ to, children, onClick, ...rest }) {
  const navigate = useTransitionNavigate();

  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
