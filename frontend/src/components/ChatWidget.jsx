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
 const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'cv'
 const [jdText, setJdText] = useState('');
 const [isGeneratingCV, setIsGeneratingCV] = useState(false);
 const [cvError, setCvError] = useState('');

 const messagesEndRef = useRef(null);
 const inputRef = useRef(null);
 const chatContainerRef = useRef(null);

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
 const update = () => {
 setViewport({
 height: vv ? vv.height : window.innerHeight,
 offsetTop: vv ? vv.offsetTop : 0,
 width: vv ? vv.width : window.innerWidth,
 });
 };
 update();
 if (vv) {
 vv.addEventListener('resize', update);
 vv.addEventListener('scroll', update);
 } else {
 window.addEventListener('resize', update);
 }
 return () => {
 if (vv) {
 vv.removeEventListener('resize', update);
 vv.removeEventListener('scroll', update);
 } else {
 window.removeEventListener('resize', update);
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

 useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom, isStreaming]);

 // When the visual viewport changes (keyboard open/close), pin the latest
 // message to the bottom so the user always sees what they're typing about.
 useEffect(() => {
 if (!isOpen || !isMobileChat) return;
 scrollToBottom('auto');
 }, [viewport.height, viewport.offsetTop, isOpen, isMobileChat, scrollToBottom]);

 useEffect(() => {
 if (isOpen) {
 setHasNewMessage(false);
 checkHealth();
 requestAnimationFrame(() => {
 inputRef.current?.focus({ preventScroll: true });
 scrollToBottom('auto');
 });
 }
 }, [isOpen, scrollToBottom]);

 useEffect(() => {
 if (!isOpen || activeTab !== 'chat' || !isMobileChat) return;
 const refocus = () => {
 if (document.activeElement !== inputRef.current) {
 inputRef.current?.focus({ preventScroll: true });
 }
 };
 window.addEventListener('orientationchange', refocus);
 return () => window.removeEventListener('orientationchange', refocus);
 }, [isOpen, activeTab, isMobileChat]);

 const checkHealth = async () => {
 try {
 const res = await fetch(`${API_URL}/health`);
 if (res.ok) {
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
 }
 } catch {
 setIsConnected(false);
 }
 };

 const sendMessage = async (messageText) => {
 const text = messageText || input.trim();
 if (!text || isLoading || isStreaming || !isConnected) return;

 setShowSuggestions(false);
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

 if (!res.ok) throw new Error('Stream failed');
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
 } catch {}
 }
 }
 }
 setIsStreaming(false);
 } catch {
 setMessages((prev) => {
 const updated = [...prev];
 const lastIdx = updated.length - 1;
 if (lastIdx >= 0 && !updated[lastIdx].isUser && !updated[lastIdx].content) {
 updated[lastIdx] = { ...updated[lastIdx], content: 'Sorry, I encountered an error. Please try again.' };
 }
 return updated;
 });
 } finally {
 setIsLoading(false);
 setIsStreaming(false);
 requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
 }
 };

 const generateCV = async () => {
 if (!jdText.trim() || jdText.length < 10) {
 setCvError('Please paste a longer job description.');
 return;
 }
 setIsGeneratingCV(true);
 setCvError('');
 
 try {
 const res = await fetch(`${API_URL}/generate-cv`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ job_description: jdText }),
 });

 if (!res.ok) {
 throw new Error('Failed to generate CV');
 }

 // Download the file
 const blob = await res.blob();
 const url = window.URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = 'Saud_Ahmad_CV.pdf';
 document.body.appendChild(a);
 a.click();
 a.remove();
 window.URL.revokeObjectURL(url);
 } catch (err) {
 setCvError('Error generating CV. Please try again later.');
 } finally {
 setIsGeneratingCV(false);
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
 className={`fixed bottom-6 right-6 max-sm:hidden z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
 isOpen
 ? 'bg-dark-800 border border-white/10 text-white rotate-0'
 : 'bg-black hover:bg-zinc-800 text-white'
 }`}
 aria-label={isOpen ? 'Close chat' : 'Open chat'}
 >
 {isOpen ? (
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 ) : (
 <>
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
 className={`fixed z-[60] transition-all duration-300 ease-out ${
 isOpen
 ? 'opacity-100 scale-100 pointer-events-auto'
 : 'opacity-0 scale-95 pointer-events-none'
 } bottom-24 right-6 w-[380px] h-[560px] max-sm:left-0 max-sm:right-0 max-sm:top-0 max-sm:bottom-auto max-sm:w-full max-sm:rounded-none max-sm:origin-bottom`}
 style={
 // On mobile, lock the panel to the visual viewport height so it
 // shrinks WITH the soft keyboard. No translate — the panel always
 // sits flush at top:0; the input sits at the bottom of this height.
 isOpen && isMobileChat
 ? { height: `${viewport.height}px` }
 : undefined
 }
 >
 <div className="w-full h-full bg-dark-900/95 border border-white/10 rounded-2xl max-sm:rounded-none shadow-2xl shadow-black/40 flex flex-col overflow-hidden max-sm:border-0">
 {/* Header */}
 <div className="flex items-center justify-between gap-3 px-4 py-3 bg-dark-800/90 border-b border-white/5 shrink-0 max-sm:pt-[calc(env(safe-area-inset-top)+0.75rem)]">
 <div className="flex bg-dark-900 rounded-lg p-1 border border-white/5 min-w-0">
 <button
 onClick={() => setActiveTab('chat')}
 className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
 activeTab === 'chat' ? 'bg-black text-white shadow-sm' : 'text-zinc-400 hover:text-white'
 }`}
 >
 Chat
 </button>
 <button
 onClick={() => setActiveTab('cv')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
 activeTab === 'cv' ? 'bg-black text-white shadow-sm' : 'text-zinc-400 hover:text-white'
 }`}
 >
 Tailor CV
 <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
 </button>
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

 {activeTab === 'chat' && (
 <div className="flex-1 min-h-0 flex flex-col">
 {/* Messages */}
 <div
 ref={chatContainerRef}
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
 )}

 {activeTab === 'cv' && (
 <div
 className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto overscroll-contain"
 style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
 >
 <h3 className="text-white font-heading font-bold text-lg mb-2">Tailor My CV</h3>
 <p className="text-zinc-400 text-xs mb-4">Paste a Job Description. I will use AI and my embedded experiences/projects to generate a tailored ATS-friendly PDF CV matching the role requirements.</p>

 <textarea
 value={jdText}
 onChange={(e) => setJdText(e.target.value)}
 placeholder="Paste Job Description here..."
 className="flex-1 min-h-48 w-full bg-dark-800/80 border border-white/5 rounded-xl p-3 text-[16px] sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-primary-500/50 transition-colors resize-none mb-4"
 />

 {cvError && <p className="text-black text-xs mb-2">{cvError}</p>}

 <button
 onClick={generateCV}
 disabled={isGeneratingCV || !jdText.trim()}
 className={`w-full py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-semibold transition-all shadow-lg ${
 isGeneratingCV || !jdText.trim()
 ? 'bg-dark-800 text-zinc-500 cursor-not-allowed'
 : 'bg-black hover:bg-zinc-800 text-white active:scale-95'
 }`}
 >
 {isGeneratingCV ? (
 <>
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 Generating PDF (might take ~15s)...
 </>
 ) : (
 <>
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
 </svg>
 Generate Tailored CV PDF
 </>
 )}
 </button>
 </div>
 )}
 </div>
 </div>
 </>
 );
}
