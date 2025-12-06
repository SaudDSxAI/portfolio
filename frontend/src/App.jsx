import { useState, useRef, useEffect, useCallback } from 'react';

const API_URL = 'https://asksaud.up.railway.app';

// Simple Markdown renderer component
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

      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
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

// Message bubble component
const MessageBubble = ({ message, isUser, isStreaming }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fadeIn px-2`}>
    {!isUser && (
      <img 
        src="/saud.jpeg" 
        alt="Saud Ahmad"
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
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 animate-pulse rounded-sm"></span>
          )}
        </>
      )}
      <span className={`text-[10px] mt-1 block text-right ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
        {message.timestamp}
      </span>
    </div>
  </div>
);

// Typing indicator (shown before streaming starts)
const TypingIndicator = () => (
  <div className="flex justify-start mb-3 animate-fadeIn px-2">
    <img 
      src="/saud.jpeg" 
      alt="Saud Ahmad"
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

// Suggested questions component
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
          className="px-3 py-2 bg-white/80 text-slate-700 text-sm rounded-xl border border-slate-200 active:bg-slate-100 transition-colors disabled:opacity-50 touch-manipulation"
        >
          {question}
        </button>
      ))}
    </div>
  );
};

// Main App Component
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
  const abortControllerRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'end'
      });
    }
  }, []);

  // Handle viewport resize (keyboard open/close)
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardOpen = windowHeight - viewportHeight > 150;
      
      if (keyboardOpen) {
        setTimeout(() => scrollToBottom(false), 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollToBottom]);

  // Scroll on new messages or streaming updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check API health on mount
  useEffect(() => {
    checkHealth();
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.body.style.overscrollBehavior = 'auto';
      // Cleanup any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        setIsConnected(true);
        setMessages([{
          id: 'welcome',
          content: "Hey there! 👋 I'm Saud's AI assistant. I can tell you about his skills, experience, projects, and more. What would you like to know?",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      setIsConnected(false);
      console.error('API not reachable:', error);
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setShowSuggestions(false);

    // Add user message immediately (optimistic UI)
    const userMessage = {
      id: Date.now(),
      content: text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Keep focus on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Use streaming endpoint
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error('Stream request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      // Create placeholder for AI message
      const aiMessageId = Date.now() + 1;
      const aiMessage = {
        id: aiMessageId,
        content: '',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      setIsStreaming(true);

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'session' && data.session_id) {
                setSessionId(data.session_id);
              } else if (data.type === 'content' && data.content) {
                fullContent += data.content;
                
                // Update message content in real-time
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && !updated[lastIndex].isUser) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: fullContent
                    };
                  }
                  return updated;
                });
              } else if (data.type === 'done') {
                setIsStreaming(false);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }

      setIsStreaming(false);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      console.error('Error:', error);
      setIsLoading(false);
      setIsStreaming(false);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Sorry, something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (sessionId) {
      try {
        await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
    
    setMessages([{
      id: 'welcome',
      content: "Chat cleared! How can I help you?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setSessionId(null);
    setShowSuggestions(true);
    setIsLoading(false);
    setIsStreaming(false);
  };

  const handleInputFocus = () => {
    setTimeout(() => scrollToBottom(false), 300);
  };

  return (
    <div className="h-screen h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col overflow-hidden font-sans">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-3 py-3 flex items-center justify-between safe-area-top z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src="/saud.jpeg" 
              alt="Saud Ahmad"
              className="w-10 h-10 rounded-full object-cover object-top ring-2 ring-white/30"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-emerald-600 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">AskSaud</h1>
            <p className="text-emerald-100/80 text-xs">
              {isStreaming ? 'Typing...' : isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="px-3 py-1.5 bg-white/15 text-white text-xs font-medium rounded-lg active:bg-white/25 transition-colors touch-manipulation"
        >
          Clear
        </button>
      </header>

      {/* Chat Messages Area */}
      <main 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overscroll-none bg-slate-50/5"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="py-3 min-h-full flex flex-col justify-end">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4">
                ⚠️
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Connection Error</h3>
              <p className="text-slate-400 text-sm mb-4">Unable to connect to the server</p>
              <button
                onClick={checkHealth}
                className="px-5 py-2.5 bg-emerald-500 text-white font-medium rounded-xl active:bg-emerald-600 transition-colors touch-manipulation"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
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
              {isLoading && !isStreaming && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>
      </main>

      {/* Fixed Input Area */}
      <footer className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/5 safe-area-bottom z-50">
        <form 
          onSubmit={handleSubmit} 
          className="flex items-end gap-2 p-2"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder="Type a message..."
              disabled={!isConnected || isLoading || isStreaming}
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              enterKeyHint="send"
              className="w-full bg-white/10 text-white placeholder-slate-400 px-4 py-3 rounded-full border border-white/10 focus:border-emerald-500/50 focus:outline-none transition-colors disabled:opacity-50 text-[16px]"
              style={{ fontSize: '16px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!isConnected || isLoading || isStreaming || !input.trim()}
            className="flex-shrink-0 w-11 h-11 bg-emerald-500 text-white rounded-full flex items-center justify-center active:bg-emerald-600 transition-colors disabled:opacity-50 disabled:bg-slate-600 touch-manipulation"
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
        <p className="text-center text-slate-500 text-[10px] pb-2">
          Powered by LangGraph & OpenAI
        </p>
      </footer>

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        
        html, body, #root {
          height: 100%;
          height: 100dvh;
          overflow: hidden;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        input, textarea, select {
          font-size: 16px !important;
        }
        
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        .touch-manipulation {
          touch-action: manipulation;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            display: none;
          }
          * {
            scrollbar-width: none;
          }
        }
        
        button, header, footer {
          user-select: none;
          -webkit-user-select: none;
        }
        
        main {
          overscroll-behavior: contain;
        }
      `}</style>
    </div>
  );
}