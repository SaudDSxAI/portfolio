import { useState, useRef, useEffect, useCallback, memo } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ===== Markdown Renderer (memoized so unchanged bubbles don't re-render) =====
const MarkdownText = memo(function MarkdownText({ content }) {
 const renderMarkdown = (text) => {
 if (!text) return null;
 const lines = text.split('\n');
 const elements = [];
 let listItems = [];

 const processInlineStyles = (line) => {
 let processed = line;
 processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>');
 processed = processed.replace(/__(.+?)__/g, '<strong class="font-bold text-zinc-100">$1</strong>');
 processed = processed.replace(/`(.+?)`/g, '<code class="bg-zinc-800/50 px-1.5 py-0.5 rounded text-sm font-mono text-black border border-zinc-700/50">$1</code>');
 processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-black hover:text-black underline underline-offset-2 transition-colors">$1</a>');
 return processed;
 };

 const flushList = () => {
 if (listItems.length > 0) {
 elements.push(
 <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1.5 my-3 ml-2 text-zinc-300 marker:text-black">
 {listItems.map((item, i) => (
 <li key={i} className="text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
 ))}
 </ul>
 );
 listItems = [];
 }
 };

 lines.forEach((line, index) => {
 const trimmedLine = line.trim();
 if (!trimmedLine) { flushList(); elements.push(<div key={`empty-${index}`} className="h-2" />); return; }
 if (trimmedLine.startsWith('### ')) { flushList(); elements.push(<h3 key={index} className="text-sm font-bold text-white mt-3 mb-1.5" dangerouslySetInnerHTML={{ __html: processInlineStyles(trimmedLine.slice(4)) }} />); return; }
 if (trimmedLine.startsWith('## ')) { flushList(); elements.push(<h2 key={index} className="text-base font-bold text-white mt-4 mb-2" dangerouslySetInnerHTML={{ __html: processInlineStyles(trimmedLine.slice(3)) }} />); return; }
 if (trimmedLine.startsWith('# ')) { flushList(); elements.push(<h1 key={index} className="text-lg font-bold text-white mt-4 mb-2 border-b border-zinc-700/50 pb-1" dangerouslySetInnerHTML={{ __html: processInlineStyles(trimmedLine.slice(2)) }} />); return; }
 const listMatch = trimmedLine.match(/^[-*▸◈]\s+(.*)/);
 if (listMatch) { listItems.push(processInlineStyles(listMatch[1])); return; }
 if (/^\d+\.\s/.test(trimmedLine)) { listItems.push(processInlineStyles(trimmedLine.replace(/^\d+\.\s/, ''))); return; }
 flushList();
 elements.push(<p key={index} className="text-[14px] leading-relaxed my-1 text-zinc-300" dangerouslySetInnerHTML={{ __html: processInlineStyles(trimmedLine) }} />);
 });
 flushList();
 return elements;
 };
 return <div className="markdown-content font-sans">{renderMarkdown(content)}</div>;
});

// ===== Message Bubble (memoized — only the streaming/last bubble re-renders) =====
const MessageBubble = memo(function MessageBubble({ message, isUser, isStreaming }) { return (
 <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-slide-up px-1`}>
 {!isUser && (
 <div className="relative mr-2 mt-1 flex-shrink-0">
 <img
 src="/saud.jpeg"
 alt="Saud"
 width="28"
 height="28"
 loading="lazy"
 decoding="async"
 className="w-7 h-7 rounded-full object-cover object-top ring-1 ring-black/30 shadow-md"
 />
 </div>
 )}
 <div className={`max-w-[85%] px-4 py-3 shadow-sm mb-4 ${isUser
 ? 'bg-black text-white rounded-2xl rounded-tr-sm border border-black/20'
 : 'bg-dark-800/90 text-zinc-200 rounded-2xl rounded-tl-sm border border-zinc-700/50'
 }`}>
 {isUser ? (
 <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
 ) : (
 <>
 {message.content && <MarkdownText content={message.content} />}
 {isStreaming && (
 <div className={`flex items-center gap-1.5 ${message.content ? 'mt-4' : 'py-1'}`}>
 <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
 <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
 <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
 </div>
 )}
 </>
 )}
 {message.content && (
 <div className={`text-[10px] mt-2 opacity-50 ${isUser ? 'text-right text-primary-100' : 'text-right'}`}>
 {message.timestamp}
 </div>
 )}
 </div>
 </div>
); });


// ===== Suggested Questions =====
const SuggestedQuestions = ({ onSelect, disabled }) => {
 const suggestions = [
 "What are Saud's main skills?",
 "Tell me about his experience",
 "Show me his projects",
 "How to contact him?",
 ];
 return (
 <div className="grid grid-cols-1 gap-1.5 mb-3 animate-fade-in px-1">
 {suggestions.map((text, i) => (
 <button key={i} onClick={() => onSelect(text)} disabled={disabled}
 className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs rounded-xl border border-white/5 hover:border-black/20 transition-all disabled:opacity-50"
 >
 {text}
 </button>
 ))}
 </div>
 );
};

// ===== Main Chat Widget =====
export default function ChatWidget({ initialOpen = false } = {}) {
 const [isOpen, setIsOpen] = useState(initialOpen);
 const [messages, setMessages] = useState([]);
 const [input, setInput] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [isStreaming, setIsStreaming] = useState(false);
 const [sessionId, setSessionId] = useState(null);
 const [isConnected, setIsConnected] = useState(false);
 const [showSuggestions, setShowSuggestions] = useState(true);
 const [hasNewMessage, setHasNewMessage] = useState(false);

 const messagesEndRef = useRef(null);
 const inputRef = useRef(null);
 const chatContainerRef = useRef(null);

 // Whether we should auto-scroll to the newest message. True by default,
 // but flips to false the moment the user manually scrolls away from the
 // bottom (e.g. to reread something while a reply is still streaming in) —
 // otherwise every streamed chunk would yank them back down. Flips back to
 // true once they scroll back near the bottom themselves, sends a new
 // message, or taps the "jump to latest" button — matching how ChatGPT lets
 // you freely scroll up mid-generation without being dragged back down.
 const stickToBottomRef = useRef(true);
 // Mirrors stickToBottomRef in React state purely so the "jump to latest"
 // button can react to it — the ref stays the source of truth read inside
 // scroll/stream callbacks (state would be stale there).
 const [isStuckToBottom, setIsStuckToBottom] = useState(true);
 const setSticky = useCallback((value) => {
 stickToBottomRef.current = value;
 setIsStuckToBottom(value);
 }, []);

 // Track the visual viewport so the mobile chat follows the part of the
 // screen that remains visible above the soft keyboard.
 const [viewport, setViewport] = useState(() => ({
 height: typeof window !== 'undefined' ? window.innerHeight : 0,
 offsetTop: 0,
 width: typeof window !== 'undefined' ? window.innerWidth : 0,
 }));

 const isMobileChat = viewport.width <= 640;

 useEffect(() => {
 if (typeof window === 'undefined') return;
 const vv = window.visualViewport;
 // iOS/Android fire a burst of resize/scroll events while the keyboard is
 // animating open or closed (not just one at the end). Committing a React
 // state update — and therefore a re-render of the fixed, height-bound
 // panel — on every single one of those events is what made the keyboard
 // handling feel janky and, on some Android WebViews, could interrupt the
 // input's focus mid-animation. Coalescing to one update per animation
 // frame keeps the panel following the keyboard smoothly instead.
 let rafId = null;
 const commit = () => {
 rafId = null;
 setViewport({
 height: vv ? vv.height : window.innerHeight,
 offsetTop: vv ? vv.offsetTop : 0,
 width: vv ? vv.width : window.innerWidth,
 });
 };
 const schedule = () => {
 if (rafId != null) return;
 rafId = requestAnimationFrame(commit);
 };
 commit();
 if (vv) {
 vv.addEventListener('resize', schedule);
 vv.addEventListener('scroll', schedule);
 } else {
 window.addEventListener('resize', schedule);
 }
 return () => {
 if (rafId != null) cancelAnimationFrame(rafId);
 if (vv) {
 vv.removeEventListener('resize', schedule);
 vv.removeEventListener('scroll', schedule);
 } else {
 window.removeEventListener('resize', schedule);
 }
 };
 }, []);

 // Light scroll lock on mobile while chat is open. We deliberately avoid
 // `position: fixed` on body — that pattern breaks input focus on iOS when
 // combined with the visual viewport adjustments below.
 useEffect(() => {
 if (typeof document === 'undefined') return;
 if (isOpen && isMobileChat) {
 const previous = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = previous;
 };
 }
 }, [isOpen, isMobileChat]);

 // Listen for external open event (from Navbar / Hero / Contact)
 useEffect(() => {
 const handler = () => setIsOpen(true);
 window.addEventListener('openChat', handler);
 return () => window.removeEventListener('openChat', handler);
 }, []);

 const scrollToBottom = useCallback((behavior = 'smooth') => {
 if (chatContainerRef.current) {
 chatContainerRef.current.scrollTo({
 top: chatContainerRef.current.scrollHeight,
 behavior,
 });
 }
 }, []);

 const isNearBottom = useCallback(() => {
 const el = chatContainerRef.current;
 if (!el) return true;
 const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
 return distanceFromBottom < 80;
 }, []);

 // Near the bottom = "stick" (auto-scroll keeps following new content).
 // Scrolled away = the user is deliberately reading something earlier;
 // leave them alone until they scroll back down themselves.
 const handleMessagesScroll = useCallback(() => {
 setSticky(isNearBottom());
 }, [isNearBottom, setSticky]);

 // Fires the instant a touch/drag/wheel gesture starts on the message
 // list — don't wait for the browser's `scroll` event. On iOS that event
 // is throttled hard enough during an active swipe that, with a reply
 // streaming in, several tokens can land (each one snapping the view back
 // to the bottom) before `scroll` ever fires once. That's what made
 // scrolling up mid-generation feel like it kept getting yanked back down.
 // Reacting on gesture-start instead makes it stop instantly, every time.
 const handleUserScrollIntent = useCallback(() => {
 setSticky(false);
 }, [setSticky]);

 useEffect(() => {
 if (!stickToBottomRef.current) return;
 // Coalesce to one scroll per frame — a fast stream can otherwise call
 // this dozens of times a second, each restarting a 'smooth' animation
 // that visibly fights anything else touching the scroll position.
 const id = requestAnimationFrame(() => {
 if (stickToBottomRef.current) scrollToBottom('auto');
 });
 return () => cancelAnimationFrame(id);
 }, [messages, scrollToBottom, isStreaming]);

 // When the visual viewport changes (keyboard open/close), pin the latest
 // message to the bottom so the user always sees what they're typing about
 // — but only if they were already following along at the bottom.
 useEffect(() => {
 if (!isOpen || !isMobileChat) return;
 if (stickToBottomRef.current) scrollToBottom('auto');
 }, [viewport.height, viewport.offsetTop, isOpen, isMobileChat, scrollToBottom]);

 useEffect(() => {
 if (isOpen) {
 setHasNewMessage(false);
 setSticky(true);
 checkHealth();
 requestAnimationFrame(() => {
 inputRef.current?.focus({ preventScroll: true });
 scrollToBottom('auto');
 });
 }
 }, [isOpen, scrollToBottom]);

 useEffect(() => {
 if (!isOpen || !isMobileChat) return;
 const refocus = () => {
 if (document.activeElement !== inputRef.current) {
 inputRef.current?.focus({ preventScroll: true });
 }
 };
 window.addEventListener('orientationchange', refocus);
 return () => window.removeEventListener('orientationchange', refocus);
 }, [isOpen, isMobileChat]);

 const checkHealth = async () => {
 try {
 const res = await fetch(`${API_URL}/health`);
 if (!res.ok) {
 console.error(`[chat] /health returned HTTP ${res.status}`);
 setIsConnected(false);
 return;
 }
 setIsConnected(true);
 setMessages((prev) =>
 prev.length === 0
 ? [{
 id: 'welcome',
 content: "Hello! I'm Saud's AI assistant. Ask me about his skills, experience, projects, and more!",
 isUser: false,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 }]
 : prev
 );
 } catch (err) {
 console.error('[chat] /health unreachable:', err);
 setIsConnected(false);
 }
 };

 const sendMessage = async (messageText) => {
 const text = messageText || input.trim();
 if (!text || isLoading || isStreaming) return;
 if (!isConnected) {
 // Try one more health check before giving up
 console.warn('[chat] not connected — re-checking /health…');
 await checkHealth();
 if (!isConnected) {
 setMessages((prev) => [
 ...prev,
 {
 id: Date.now(),
 content:
 '⚠ Cannot reach the AI server. Open DevTools → Console for the exact error, then check that the backend is running on :8000.',
 isUser: false,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 },
 ]);
 return;
 }
 }

 setShowSuggestions(false);
 // Sending a message means the user wants to follow the conversation
 // again — resume auto-scroll even if they'd scrolled away earlier.
 setSticky(true);
 const userMessage = {
 id: Date.now(),
 content: text,
 isUser: true,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 };

 const aiMessageId = Date.now() + 1;
 setMessages((prev) => [
 ...prev, 
 userMessage,
 { id: aiMessageId, content: '', isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
 ]);
 setInput('');
 setIsLoading(true);
 requestAnimationFrame(() => {
 inputRef.current?.focus({ preventScroll: true });
 scrollToBottom('auto');
 });

 try {
 const res = await fetch(`${API_URL}/chat/stream`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ message: text, session_id: sessionId }),
 });

 if (!res.ok) {
 const body = await res.text().catch(() => '');
 console.error(`[chat] /chat/stream returned HTTP ${res.status}`, body);
 throw new Error(`Backend returned HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}`);
 }
 const reader = res.body.getReader();
 const decoder = new TextDecoder();

 setIsLoading(false);
 setIsStreaming(true);

 let fullContent = '';
 let buffer = '';

 while (true) {
 const { done, value } = await reader.read();
 if (done) break;

 buffer += decoder.decode(value, { stream: true });
 const lines = buffer.split('\n');
 buffer = lines.pop(); // keep incomplete line in buffer

 for (const line of lines) {
 const trimmed = line.trim();
 if (trimmed.startsWith('data: ')) {
 try {
 const data = JSON.parse(trimmed.slice(6));
 if (data.type === 'session') {
 setSessionId(data.session_id);
 } else if (data.type === 'content') {
 fullContent += data.content;
 setMessages((prev) => {
 const updated = [...prev];
 const lastIdx = updated.length - 1;
 if (lastIdx >= 0 && !updated[lastIdx].isUser) {
 updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
 }
 return updated;
 });
 } else if (data.type === 'done') {
 setMessages((prev) => {
 const updated = [...prev];
 const lastIdx = updated.length - 1;
 if (lastIdx >= 0 && !updated[lastIdx].isUser) {
 updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
 }
 return updated;
 });
 setIsStreaming(false);
 if (!isOpen) setHasNewMessage(true);
 } else if (data.type === 'error') {
 throw new Error(data.error);
 }
 } catch (parseErr) {
 // Only swallow JSON parse errors; rethrow real backend errors.
 if (parseErr && parseErr.message && !parseErr.message.startsWith('Unexpected')) {
 console.error('[chat] stream error event:', parseErr);
 throw parseErr;
 }
 }
 }
 }
 }
 setIsStreaming(false);
 } catch (err) {
 console.error('[chat] sendMessage failed:', err);
 const errorMsg = err?.message || String(err) || 'Unknown error';
 setMessages((prev) => {
 const updated = [...prev];
 const lastIdx = updated.length - 1;
 if (lastIdx >= 0 && !updated[lastIdx].isUser) {
 updated[lastIdx] = {
 ...updated[lastIdx],
 content: `⚠ ${errorMsg}\n\n_Check DevTools → Console for full details._`,
 };
 }
 return updated;
 });
 } finally {
 setIsLoading(false);
 setIsStreaming(false);
 // Only reclaim focus if the user is still following along at the
 // bottom. If they scrolled up mid-generation to reread something, this
 // would otherwise yank the keyboard back open the moment the reply
 // finishes — exactly the "closes/reopens on its own" feeling to avoid.
 if (stickToBottomRef.current) {
 requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
 }
 }
 };

 // Critical for mobile: focus must stay on the input synchronously so the
 // keyboard never collapses. We refocus *immediately* (no setTimeout)
 // before any state updates can cause a re-render that yanks focus.
 const handleSubmit = (e) => {
 if (e && e.preventDefault) e.preventDefault();
 inputRef.current?.focus({ preventScroll: true });
 sendMessage();
 };

 const clearChat = async () => {
 if (sessionId) {
 try { await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' }); } catch {}
 }
 setMessages([{
 id: 'welcome',
 content: "Chat cleared! What else would you like to know?",
 isUser: false,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 }]);
 setSessionId(null);
 setShowSuggestions(true);
 };

 return (
 <>
 {/* ===== Floating Button ===== */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={`fixed z-50 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bottom-5 right-4 w-12 h-12 md:bottom-6 md:right-6 md:w-14 md:h-14 ${
 isOpen
 ? 'bg-dark-800 border border-white/10 text-white rotate-0'
 : 'bg-black hover:bg-zinc-800 text-white'
 }`}
 aria-label={isOpen ? 'Close chat' : 'Open chat'}
 >
 {isOpen ? (
 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 ) : (
 <>
 <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
 </svg>
 {/* Pulse ring */}
 <span className="absolute inset-0 rounded-full bg-black/30 animate-ping opacity-40" />
 </>
 )}
 {/* New message badge */}
 {hasNewMessage && !isOpen && (
 <span className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full border-2 border-dark-900 animate-pulse" />
 )}
 </button>

 {/* ===== Chat Panel ===== */}
 <div
 className={`fixed z-[60] transition-[opacity,transform] duration-300 ease-out ${
 isOpen
 ? 'opacity-100 scale-100 pointer-events-auto'
 : 'opacity-0 scale-95 pointer-events-none'
 } bottom-24 right-6 w-[380px] h-[560px] max-sm:left-0 max-sm:right-0 max-sm:top-0 max-sm:bottom-auto max-sm:w-full max-sm:rounded-none max-sm:origin-bottom`}
 style={
 // On mobile, lock the panel to the visual viewport height so it
 // shrinks WITH the soft keyboard — the panel always sits flush at
 // top:0; the input sits at the bottom of this height. Deliberately
 // excluded from the transition above (see className): this has to
 // track the real keyboard 1:1, not ease in 300ms behind it, which is
 // what made the input feel misaligned from the keyboard while it
 // animated open.
 isOpen && isMobileChat
 ? { height: `${viewport.height}px` }
 : undefined
 }
 >
 <div className="w-full h-full bg-dark-900/95 border border-white/10 rounded-2xl max-sm:rounded-none shadow-2xl shadow-black/40 flex flex-col overflow-hidden max-sm:border-0">
 {/* Header */}
 <div className="flex items-center justify-between gap-3 px-4 py-3 bg-dark-800/90 border-b border-white/5 shrink-0 max-sm:pt-[calc(env(safe-area-inset-top)+0.75rem)]">
 <div className="flex items-center gap-2 min-w-0">
 <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
 <span className="text-sm font-semibold text-white truncate">Ask Saud's AI</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={clearChat}
 onMouseDown={(e) => e.preventDefault()}
 className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
 title="Clear Chat"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
 </svg>
 </button>
 {/* Mobile Close Button — large and prominent */}
 <button
 onClick={() => setIsOpen(false)}
 className="sm:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-black transition-all border border-white/10 hover:border-black/30 active:scale-90"
 title="Close Chat"
 >
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 </div>

 <div className="flex-1 min-h-0 flex flex-col relative">
 {/* Messages */}
 <div
 ref={chatContainerRef}
 onScroll={handleMessagesScroll}
 onTouchStart={handleUserScrollIntent}
 onWheel={handleUserScrollIntent}
 className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 space-y-0"
 style={{
 scrollbarWidth: 'none',
 WebkitOverflowScrolling: 'touch',
 touchAction: 'pan-y',
 }}
 >
 {!isConnected ? (
 <div className="flex flex-col items-center justify-center h-full text-center px-4">
 <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center text-2xl mb-4 ring-1 ring-black/20">⚠️</div>
 <h3 className="text-white font-bold text-sm mb-2">Connection Error</h3>
 <p className="text-zinc-400 text-xs mb-4">Unable to reach the AI server.</p>
 <button onClick={checkHealth} className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all">
 Retry
 </button>
 </div>
 ) : (
 <>
 {messages.map((message, index) => (
 <MessageBubble
 key={message.id}
 message={message}
 isUser={message.isUser}
 isStreaming={(isStreaming || isLoading) && index === messages.length - 1 && !message.isUser}
 />
 ))}
 {showSuggestions && messages.length === 1 && (
 <SuggestedQuestions onSelect={sendMessage} disabled={isLoading || isStreaming} />
 )}
 <div ref={messagesEndRef} className="h-2" />
 </>
 )}
 </div>

 {/* Jump to latest — appears the moment you scroll away from the
 bottom (including mid-generation), so following a reply is a
 deliberate choice rather than something forced on you. */}
 {isConnected && !isStuckToBottom && messages.length > 0 && (
 <button
 onClick={() => {
 setSticky(true);
 scrollToBottom('smooth');
 }}
 className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-dark-800/95 hover:bg-dark-700 border border-white/10 text-zinc-200 text-xs font-semibold shadow-lg shadow-black/30 backdrop-blur-sm transition-all animate-fade-in z-10"
 >
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
 </svg>
 {isStreaming ? 'New reply' : 'Jump to latest'}
 </button>
 )}

 {/* Input */}
 <div className="shrink-0 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-dark-800/80 border-t border-white/5">
 <form onSubmit={handleSubmit} className="flex items-center gap-2">
 <div className="flex-1 bg-dark-800 rounded-2xl px-3 py-2.5 border border-white/5 focus-within:border-primary-500/50 transition-colors shadow-inner shadow-black/20">
 <input
 ref={inputRef}
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="Ask about Saud..."
 autoComplete="off"
 enterKeyHint="send"
 inputMode="text"
 className="w-full bg-transparent text-white placeholder-zinc-500 outline-none text-[16px] sm:text-sm"
 />
 </div>
 <button
 type="submit"
 onMouseDown={(e) => e.preventDefault()}
 disabled={!isConnected || isLoading || isStreaming || !input.trim()}
 className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
 !isConnected || isLoading || isStreaming || !input.trim()
 ? 'bg-dark-800 text-zinc-600 cursor-not-allowed'
 : 'bg-primary-600 hover:bg-primary-700 text-white active:scale-95 shadow-lg shadow-primary-900/30'
 }`}
 aria-label="Send message"
 >
 {isLoading ? (
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
 </svg>
 )}
 </button>
 </form>
 </div>
 </div>
 </div>
 </div>
 </>
 );
}
