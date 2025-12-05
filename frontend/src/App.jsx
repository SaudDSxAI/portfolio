import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_URL = 'https://asksaud.up.railway.app';

// Message bubble component with markdown support
const MessageBubble = ({ message, isUser }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}>
    {!isUser && (
      <img 
        src="/saud.jpeg" 
        alt="Saud Ahmad"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover object-top mr-2 sm:mr-3 mt-1 ring-2 ring-emerald-500/30 flex-shrink-0"
      />
    )}
    <div
      className={`max-w-[75%] sm:max-w-[70%] px-4 sm:px-5 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.01] ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm'
          : 'bg-white/95 backdrop-blur-sm text-slate-800 rounded-bl-sm border border-slate-200/50'
      }`}
    >
      {isUser ? (
        <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
      ) : (
        <div className="prose prose-sm sm:prose-base prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 mt-3" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-2 mt-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-sm sm:text-base font-semibold text-slate-700 mb-1.5 mt-2" {...props} />,
              p: ({node, ...props}) => <p className="text-sm sm:text-[15px] leading-relaxed mb-2 text-slate-700" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-4 sm:pl-5 mb-2 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-4 sm:pl-5 mb-2 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="text-sm sm:text-[15px] text-slate-700" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
              em: ({node, ...props}) => <em className="italic text-slate-700" {...props} />,
              code: ({node, inline, ...props}) => 
                inline 
                  ? <code className="bg-slate-200 text-emerald-700 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono" {...props} />
                  : <code className="block bg-slate-200 text-emerald-700 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-mono overflow-x-auto" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-3 sm:pl-4 italic text-slate-600 my-2" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}
      <span className={`text-[10px] mt-2 block ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
        {message.timestamp}
      </span>
    </div>
    {isUser && (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ml-2 sm:ml-3 mt-1 text-white text-xs font-bold flex-shrink-0">
        You
      </div>
    )}
  </div>
);

// Typing indicator
const TypingIndicator = () => (
  <div className="flex justify-start mb-4 animate-fadeIn">
    <img 
      src="/saud.jpeg" 
      alt="Saud Ahmad"
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover object-top mr-2 sm:mr-3 mt-1 ring-2 ring-emerald-500/30 flex-shrink-0"
    />
    <div className="bg-white/95 backdrop-blur-sm px-4 sm:px-5 py-4 rounded-2xl rounded-bl-sm border border-slate-200/50 shadow-lg">
      <div className="flex gap-1.5">
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
    <div className="flex flex-wrap gap-2 mb-4 animate-fadeIn">
      {suggestions.map((question, index) => (
        <button
          key={index}
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs sm:text-sm rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        setIsConnected(true);
        // Add welcome message
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
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId
        })
      });

      const data = await res.json();
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const aiMessage = {
        id: Date.now() + 1,
        content: data.response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Sorry, something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-2 sm:p-4 font-sans">
      {/* Animated background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-emerald-600/5 rounded-full blur-3xl"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Chat Container */}
      <div className="relative w-full max-w-2xl h-[100vh] sm:h-[90vh] bg-slate-900/80 backdrop-blur-2xl rounded-none sm:rounded-3xl shadow-2xl shadow-black/50 border-0 sm:border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between relative overflow-hidden">
          {/* Header shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
          
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="relative group">
              <img 
                src="/saud.jpeg" 
                alt="Saud Ahmad"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover object-top ring-3 ring-white/30 group-hover:ring-white/50 transition-all duration-300 shadow-lg"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-emerald-600 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg sm:text-xl tracking-tight drop-shadow-md">AskSaud</h1>
              <p className="text-emerald-100/90 text-xs sm:text-sm font-medium">AI Portfolio Assistant</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="relative z-10 px-3 sm:px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 hover:shadow-lg"
          >
            Clear
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-4 animate-pulse">
                ⚠️
              </div>
              <h3 className="text-white font-semibold text-lg sm:text-xl mb-2">Connection Error</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-xs">Unable to connect to the API server. Please check your connection and try again.</p>
              <button
                onClick={checkHealth}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} isUser={message.isUser} />
              ))}
              {showSuggestions && messages.length === 1 && (
                <SuggestedQuestions onSelect={sendMessage} disabled={isLoading} />
              )}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-slate-950/50 border-t border-white/5">
          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Saud..."
              disabled={!isConnected || isLoading}
              className="flex-1 bg-white/10 text-white placeholder-slate-400 px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!isConnected || isLoading || !input.trim()}
              className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
          <p className="text-center text-slate-500 text-[10px] sm:text-xs mt-2 sm:mt-3">
            Powered by LangGraph & OpenAI • Built by <span className="text-emerald-400/80">Saud Ahmad</span>
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-200%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }

        /* Remove default prose margins on first/last elements */
        .prose > *:first-child {
          margin-top: 0 !important;
        }
        
        .prose > *:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
}