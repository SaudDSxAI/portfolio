import { useState, useRef, useEffect, useCallback } from 'react';

const API_URL = 'https://asksaud.up.railway.app';

// Markdown renderer
const MarkdownText = ({ content }) => {
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const processInlineStyles = (line) => {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      line = line.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');
      line = line.replace(/`(.+?)`/g, '<code class="bg-slate-200 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-700">$1</code>');
      line = line.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-emerald-600 hover:text-emerald-700 underline">$1</a>');
      return line;
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 ml-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-[15px]" dangerouslySetInnerHTML={{ __html: item }} />
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
        elements.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      if (trimmedLine.startsWith('### ')) {
        flushList();
        const headerText = processInlineStyles(trimmedLine.slice(4));
        elements.push(<h3 key={index} className="text-base font-bold text-slate-800 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: headerText }} />);
        return;
      }
      
      if (trimmedLine.startsWith('## ')) {
        flushList();
        const headerText = processInlineStyles(trimmedLine.slice(3));
        elements.push(<h2 key={index} className="text-lg font-bold text-slate-900 mt-3 mb-2" dangerouslySetInnerHTML={{ __html: headerText }} />);
        return;
      }
      
      if (trimmedLine.startsWith('# ')) {
        flushList();
        const headerText = processInlineStyles(trimmedLine.slice(2));
        elements.push(<h1 key={index} className="text-xl font-bold text-slate-900 mt-2 mb-2" dangerouslySetInnerHTML={{ __html: headerText }} />);
        return;
      }

      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('▸ ') || trimmedLine.startsWith('◈ ')) {
        const itemText = processInlineStyles(trimmedLine.slice(2));
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
      elements.push(<p key={index} className="text-[15px] leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: paragraphText }} />);
    });

    flushList();
    return elements;
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};

// Message bubble
const MessageBubble = ({ message, isUser, isStreaming }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fadeIn px-2`}>
    {!isUser && (
      <img 
        src="/saud.jpeg" 
        alt="Saud"
        className="w-8 h-8 rounded-full object-cover object-top mr-2 mt-1 ring-2 ring-emerald-500/30 flex-shrink-0"
      />
    )}
    <div
      className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md'
          : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
      }`}
    >
      {isUser ? (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
      ) : (
        <>
          <MarkdownText content={message.content} />
          {isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse"></span>}
        </>
      )}
      <span className={`text-[10px] mt-1 block text-right ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
        {message.timestamp}
      </span>
    </div>
  </div>
);

// Typing indicator
const TypingIndicator = () => (
  <div className="flex justify-start mb-3 animate-fadeIn px-2">
    <img 
      src="/saud.jpeg" 
      alt="Saud"
      className="w-8 h-8 rounded-full object-cover object-top mr-2 mt-1 ring-2 ring-emerald-500/30 flex-shrink-0"
    />
    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-slate-100 shadow-sm">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  </div>
);

// Suggested questions
const SuggestedQuestions = ({ onSelect, disabled }) => {
  const suggestions = [
    "What are Saud's main skills?",
    "Tell me about his experience",
    "What projects has he built?",
    "What technologies does he use?"
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-3 animate-fadeIn px-3">
      {suggestions.map((question, index) => (
        <button
          key={index}
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="px-3 py-2 bg-white/80 text-slate-700 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
        >
          {question}
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
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // CRITICAL: Mobile keyboard handling using visualViewport (from working CV Evaluator)
  useEffect(() => {
    const updateLayout = () => {
      if (window.visualViewport && inputContainerRef.current && chatContainerRef.current) {
        const viewport = window.visualViewport;
        const layoutViewport = document.documentElement.clientHeight;
        const offsetY = layoutViewport - viewport.height - viewport.offsetTop;
        
        // Move input container with keyboard
        inputContainerRef.current.style.transform = `translateY(-${offsetY}px)`;
        
        // Adjust chat container height
        const inputRect = inputContainerRef.current.getBoundingClientRect();
        const headerHeight = 60;
        chatContainerRef.current.style.bottom = `${window.innerHeight - inputRect.top}px`;
        chatContainerRef.current.style.top = `${headerHeight}px`;
        
        // Scroll to bottom when keyboard state changes
        setTimeout(() => {
          scrollToBottom();
        }, 100);
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
        setMessages([{
          id: 'welcome',
          content: "Hello! I'm Saud's AI assistant. I can tell you about his skills, experience, projects, and more. What would you like to know?",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading || isStreaming) return;

    setShowSuggestions(false);

    const userMessage = {
      id: Date.now(),
      content: text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // CRITICAL FIX #1: Keep keyboard open IMMEDIATELY before any state changes
    if (inputRef.current) {
      inputRef.current.focus();
    }

    setIsLoading(true);
    
    // CRITICAL FIX #2: Re-focus after state change to prevent keyboard close
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });

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

      // CRITICAL FIX #3: Keep keyboard open when streaming starts
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });

      let fullContent = '';
      let lastUpdateTime = Date.now();
      const STREAM_THROTTLE_MS = 50; // Smooth streaming: update every 50ms

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
                
                // SMOOTH STREAMING: Throttle updates for smoother visual effect
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
                // Final update with complete content
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
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
        
        // CRITICAL FIX #4: Maintain keyboard focus during streaming
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }
      setIsStreaming(false);

      // CRITICAL FIX #5: Re-focus after streaming completes
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });

    } catch (error) {
      // Fallback to non-streaming
      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionId })
        });
        
        const data = await res.json();
        if (!sessionId) setSessionId(data.session_id);
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          content: data.response,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        // CRITICAL FIX #6: Keep keyboard open in fallback mode
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        });

      } catch (fallbackError) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          content: 'Sorry, something went wrong. Please try again.',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' });
      } catch (e) {}
    }
    setMessages([{
      id: 'welcome',
      content: "Chat cleared! How can I help you?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setSessionId(null);
    setShowSuggestions(true);
  };

  return (
    <>
      {/* CRITICAL: Body styles for mobile (from CV Evaluator pattern) */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: fixed;
          width: 100%;
          top: 0;
          left: 0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        
        /* Prevent iOS zoom on input focus */
        input, textarea {
          font-size: 16px !important;
        }
        
        /* Hide scrollbar but keep functionality */
        .chat-container::-webkit-scrollbar { display: none; }
        .chat-container { 
          -ms-overflow-style: none; 
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" style={{
        height: '100vh',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* FIXED HEADER - Always visible (from CV Evaluator pattern) */}
        <header 
          className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between shadow-lg"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: '60px'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/saud.jpeg" 
                alt="Saud"
                className="w-10 h-10 rounded-full object-cover object-top ring-2 ring-white/30"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-emerald-600 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-base">AskSaud</h1>
              <p className="text-emerald-100/80 text-xs">
                {isStreaming ? 'Typing...' : isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Clear
          </button>
        </header>

        {/* CHAT CONTAINER - Adjusts with keyboard (from CV Evaluator pattern) */}
        <div 
          ref={chatContainerRef}
          className="chat-container bg-slate-50/5 py-4 overflow-y-auto"
          style={{
            position: 'fixed',
            top: '60px',
            bottom: '66px',
            left: 0,
            right: 0,
            overflowY: 'auto'
          }}
        >
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4">⚠️</div>
              <h3 className="text-white font-semibold text-lg mb-2">Connection Error</h3>
              <p className="text-slate-400 text-sm mb-4">Unable to connect to the server</p>
              <button onClick={checkHealth} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors">
                Retry
              </button>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isUser={message.isUser}
                  isStreaming={isStreaming && index === messages.length - 1 && !message.isUser}
                />
              ))}
              {showSuggestions && messages.length === 1 && (
                <SuggestedQuestions onSelect={sendMessage} disabled={isLoading || isStreaming} />
              )}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT CONTAINER - Fixed at bottom, moves with keyboard (from CV Evaluator pattern) */}
        <div 
          ref={inputContainerRef}
          className="bg-slate-900/95 backdrop-blur-sm border-t border-white/5 p-3"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: '66px'
          }}
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className={`flex-1 bg-white/10 rounded-full flex items-center px-4 py-3 border transition-colors ${
              isLoading || isStreaming ? 'border-emerald-500/50' : 'border-white/10'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onBlur={(e) => {
                  // CRITICAL FIX #7: Prevent keyboard from closing during loading/streaming
                  if (isLoading || isStreaming) {
                    e.preventDefault();
                    e.target.focus();
                  }
                }}
                placeholder="Type a message..."
                disabled={!isConnected || isLoading || isStreaming}
                autoComplete="off"
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-[16px] border-0"
                style={{ fontSize: '16px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!isConnected || isLoading || isStreaming || !input.trim()}
              className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-center text-slate-500 text-[10px] mt-2">Powered by LangGraph & OpenAI</p>
        </div>
      </div>
    </>
  );
}