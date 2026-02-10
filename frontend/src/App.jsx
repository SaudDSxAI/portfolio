import { useState, useRef, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.PROD
  ? 'https://asksaud.up.railway.app'
  : 'http://localhost:8001';

// Markdown renderer
const MarkdownText = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return null;

    // Split by newlines but keep code blocks intact (simplified)
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const processInlineStyles = (line) => {
      let processed = line;
      // Bold
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>');
      processed = processed.replace(/__(.+?)__/g, '<strong class="font-bold text-slate-100">$1</strong>');
      // Code
      processed = processed.replace(/`(.+?)`/g, '<code class="bg-slate-800/50 px-1.5 py-0.5 rounded text-sm font-mono text-primary-400 border border-slate-700/50">$1</code>');
      // Links
      processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors">$1</a>');
      // Unicode Bold (basic handling if passed through)
      return processed;
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1.5 my-3 ml-2 text-slate-300 marker:text-primary-500">
            {listItems.map((item, i) => (
              <li key={i} className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushList();
        elements.push(<div key={`empty-${index}`} className="h-3" />);
        return;
      }

      if (trimmedLine.startsWith('### ')) {
        flushList();
        const headerText = processInlineStyles(trimmedLine.slice(4));
        elements.push(<h3 key={index} className="text-base font-bold text-white mt-4 mb-2 font-heading tracking-wide" dangerouslySetInnerHTML={{ __html: headerText }} />);
        return;
      }

      if (trimmedLine.startsWith('## ')) {
        flushList();
        const headerText = processInlineStyles(trimmedLine.slice(3));
        elements.push(<h2 key={index} className="text-lg font-bold text-white mt-5 mb-3 font-heading tracking-tight" dangerouslySetInnerHTML={{ __html: headerText }} />);
        return;
      }

      if (trimmedLine.startsWith('# ')) {
        flushList();
        const headerText = processInlineStyles(trimmedLine.slice(2));
        elements.push(<h1 key={index} className="text-xl font-bold text-white mt-6 mb-4 font-heading tracking-tight border-b border-slate-700/50 pb-2" dangerouslySetInnerHTML={{ __html: headerText }} />);
        return;
      }

      const listMatch = trimmedLine.match(/^[-*▸◈]\s+(.*)/);
      if (listMatch) {
        const itemText = processInlineStyles(listMatch[1]);
        listItems.push(itemText);
        return;
      }

      if (/^\d+\.\s/.test(trimmedLine)) {
        const itemText = processInlineStyles(trimmedLine.replace(/^\d+\.\s/, ''));
        listItems.push(itemText);
        return;
      }

      flushList();
      const paragraphText = processInlineStyles(trimmedLine);
      elements.push(<p key={index} className="text-[15px] leading-relaxed my-1.5 text-slate-300" dangerouslySetInnerHTML={{ __html: paragraphText }} />);
    });

    flushList();
    return elements;
  };

  return <div className="markdown-content font-sans">{renderMarkdown(content)}</div>;
};

// Message bubble
const MessageBubble = ({ message, isUser, isStreaming }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 animate-slide-up px-1 group`}>
    {!isUser && (
      <div className="relative mr-3 mt-1 flex-shrink-0">
        <div className="absolute inset-0 bg-primary-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <img
          src="/saud.jpeg"
          alt="Saud"
          className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-primary-500/30 relative z-10"
        />
      </div>
    )}
    <div
      className={`max-w-[85%] px-5 py-3.5 shadow-sm backdrop-blur-sm ${isUser
        ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-tr-sm border border-primary-500/20 shadow-[0_4px_20px_rgba(22,163,74,0.15)]'
        : 'bg-dark-800/80 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
        }`}
    >
      {isUser ? (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-sans">{message.content}</p>
      ) : (
        <>
          <MarkdownText content={message.content} />
          {isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1 h-1 bg-primary-400 rounded-full animate-bounce delay-200"></span>
            </div>
          )}
        </>
      )}
      <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isUser ? 'text-primary-200 justify-end' : 'text-slate-500 justify-end'}`}>
        <span>{message.timestamp}</span>
        {isUser && <span className="opacity-70">✓</span>}
      </div>
    </div>
  </div>
);

// Typing indicator
const TypingIndicator = () => (
  <div className="flex justify-start mb-4 animate-fade-in px-1">
    <div className="relative mr-3 mt-1 flex-shrink-0">
      <img
        src="/saud.jpeg"
        alt="Saud"
        className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-primary-500/30"
      />
    </div>
    <div className="bg-dark-800/80 px-4 py-3.5 rounded-2xl rounded-tl-sm border border-slate-700/50 shadow-sm flex items-center gap-1.5 h-[46px]">
      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </div>
  </div>
);

// Suggested questions
const SuggestedQuestions = ({ onSelect, disabled }) => {
  const suggestions = [
    { text: "What are Saud's main skills?" },
    { text: "Tell me about his experience" },
    { text: "Show me his projects" },
    { text: "How to contact him?" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 animate-fade-in px-1">
      {suggestions.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item.text)}
          disabled={disabled}
          className="text-left px-4 py-3 bg-dark-800/50 hover:bg-dark-700/80 backdrop-blur-sm text-slate-200 text-sm rounded-xl border border-slate-700/50 hover:border-primary-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
        >
          <span className="font-medium">{item.text}</span>
        </button>
      ))}
    </div>
  );
};

// Main App
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, isStreaming]);

  // Handle visual viewport for mobile keyboards
  useEffect(() => {
    const updateLayout = () => {
      if (window.visualViewport && inputContainerRef.current && chatContainerRef.current) {
        const viewport = window.visualViewport;
        const layoutViewport = document.documentElement.clientHeight;
        const offsetY = layoutViewport - viewport.height - viewport.offsetTop;

        inputContainerRef.current.style.transform = `translateY(-${offsetY}px)`;

        const inputRect = inputContainerRef.current.getBoundingClientRect();
        const headerHeight = 70; // updated header height
        chatContainerRef.current.style.bottom = `${window.innerHeight - inputRect.top}px`;
        chatContainerRef.current.style.top = `${headerHeight}px`;

        setTimeout(scrollToBottom, 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateLayout);
      window.visualViewport.addEventListener('scroll', updateLayout);
    }
    window.addEventListener('load', updateLayout);
    setTimeout(updateLayout, 100);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateLayout);
        window.visualViewport.removeEventListener('scroll', updateLayout);
      }
      window.removeEventListener('load', updateLayout);
    };
  }, [scrollToBottom]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        setIsConnected(true);
        // Only set welcome message if empty
        setMessages(prev => prev.length === 0 ? [{
          id: 'welcome',
          content: "Hello! I'm Saud's AI assistant. I can tell you about his skills, experience, projects, and more. What would you like to know?",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }] : prev);
      }
    } catch (error) {
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });

      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = Date.now() + 1;

      setMessages(prev => [...prev, {
        id: aiMessageId,
        content: '',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setIsLoading(false);
      setIsStreaming(true);

      let fullContent = '';
      let lastUpdateTime = Date.now();
      const STREAM_THROTTLE_MS = 30;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'session') {
                setSessionId(data.session_id);
              } else if (data.type === 'content') {
                fullContent += data.content;
                const now = Date.now();
                if (now - lastUpdateTime >= STREAM_THROTTLE_MS || data.content.includes('\n')) {
                  lastUpdateTime = now;
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && !updated[lastIdx].isUser) {
                      updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
                    }
                    return updated;
                  });
                }
              } else if (data.type === 'done') {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && !updated[lastIdx].isUser) {
                    updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
                  }
                  return updated;
                });
                setIsStreaming(false);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) { }
          }
        }
      }
      setIsStreaming(false);
    } catch (error) {
      // Fallback
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && !updated[lastIdx].isUser && !updated[lastIdx].content) {
          updated[lastIdx] = { ...updated[lastIdx], content: "Sorry, I encountered an error. Please try again." };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) inputRef.current.focus();
    sendMessage();
    return false;
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' });
      } catch (e) { }
    }
    setMessages([{
      id: 'welcome',
      content: "Chat cleared! What else would you like to know?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setSessionId(null);
    setShowSuggestions(true);
  };

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        body { position: fixed; width: 100%; top: 0; left: 0; overflow: hidden; background: #0f172a; }
        .chat-container { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .chat-container::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Background Ambience */}
      <div className="fixed inset-0 bg-dark-900 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-teal-900/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full h-[100dvh]">
        {/* HEADER */}
        <header
          className="bg-dark-900/80 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between shadow-lg"
          style={{ height: '70px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-teal-500 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
              <img
                src="/saud.jpeg"
                alt="Saud"
                className="relative w-11 h-11 rounded-full object-cover object-top ring-2 ring-dark-900"
              />
              <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-900 transition-colors ${isConnected ? 'bg-primary-500' : 'bg-red-500'}`}>
                {isConnected && <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-75"></span>}
              </span>
            </div>
            <div>
              <h1 className="text-white font-heading font-bold text-lg leading-tight tracking-tight">Saud Ahmad</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-primary-400' : 'bg-red-400'}`}></span>
                <p className="text-slate-400 text-xs font-medium">
                  {isStreaming ? 'Typing...' : isConnected ? 'AI Assistant Online' : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="group p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all"
            title="Clear Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </header>

        {/* CHAT CONTAINER */}
        <div
          ref={chatContainerRef}
          className="chat-container bg-transparent px-4 py-6 overflow-y-auto w-full max-w-3xl mx-auto"
          style={{ position: 'fixed', top: '70px', bottom: '80px', left: 0, right: 0 }}
        >
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-4xl mb-6 ring-1 ring-red-500/20">⚠️</div>
              <h3 className="text-white font-heading font-bold text-xl mb-3">Connection Error</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">Unable to reach the AI server. Please check your connection or try again later.</p>
              <button onClick={checkHealth} className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-900/20 active:scale-95">
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.isUser}
                  isStreaming={isStreaming && index === messages.length - 1 && !message.isUser}
                />
              ))}
              {isLoading && <TypingIndicator />}
              {showSuggestions && messages.length === 1 && (
                <SuggestedQuestions onSelect={sendMessage} disabled={isLoading || isStreaming} />
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* INPUT CONTAINER */}
        <div
          ref={inputContainerRef}
          className="bg-dark-900/90 backdrop-blur-xl border-t border-white/5 p-4"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, height: '80px' }}
        >
          <div className="max-w-3xl mx-auto w-full h-full flex items-center">
            <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
              <div className={`relative flex-1 group transition-all duration-300 ${isLoading ? 'opacity-70' : ''}`}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-teal-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
                <div className="relative bg-dark-800 rounded-2xl flex items-center px-4 py-3 border border-white/10 group-hover:border-primary-500/30 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    onFocus={() => setTimeout(scrollToBottom, 100)}
                    placeholder="Ask anything about Saud's work..."
                    autoComplete="off"
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-[16px] font-sans antialiased"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!isConnected || isLoading || isStreaming || !input.trim()}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${!isConnected || isLoading || isStreaming || !input.trim()
                  ? 'bg-dark-800 text-slate-600 cursor-not-allowed border border-white/5'
                  : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-900/30 active:scale-95 hover:rotate-3'
                  }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}