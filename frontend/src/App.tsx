import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import PDFViewer from './components/PDFViewer';
import { type Message, type ChatSession, type Source } from './types';
import { Send, Settings, Key, Plus, MessageSquare, Menu, X, Trash2 } from 'lucide-react';

function App() {
  // --- State: Chat Data ---
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Thailand Guide. Ask me anything about traveling in Thailand!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- State: Config ---
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('travai_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  // --- State: Sessions (Fetched from backend) ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return localStorage.getItem('travai_current_session_id') || crypto.randomUUID();
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [pdfSources, setPdfSources] = useState<Source[]>([]);
  const pdfUrl = "/thourist_thailand_guide.pdf";


  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('http://localhost:2024/threads', {
        headers: { 'X-API-Key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const updateThreadTitle = async (id: string, title: string) => {
    if (!apiKey) return;
    try {
      await fetch(`http://localhost:2024/threads/${id}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      fetchSessions(); // Refresh list
    } catch (e) {
      console.error("Failed to update title", e);
    }
  };

  const processContentForSources = (content: string): { cleanedContent: string; sources: Source[] } => {
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?"sources"[\s\S]*?\})\s*```\s*$/;
    const match = content.match(jsonBlockRegex);

    if (match) {
      try {
        const jsonStr = match[1];
        const data = JSON.parse(jsonStr);
        if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
          // Extract ALL sources instead of just the first one
          const sources: Source[] = data.sources.map((s: any) => ({ page: s.page }));
          // Remove the JSON block from content
          const cleanedContent = content.replace(jsonBlockRegex, '').trim();
          return { cleanedContent, sources };
        }
      } catch (e) {
        console.warn("Failed to parse source JSON:", e);
      }
    }
    return { cleanedContent: content, sources: [] };
  };


  useEffect(() => {
    fetchSessions();
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('travai_current_session_id', currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadSession = async () => {
      if (!apiKey) return;

      // Reset PDF page when switching sessions
      setPdfPage(null);
      setPdfSources([]);

      try {
        setIsLoading(true);
        console.log("Fetching history for thread:", currentSessionId);
        const response = await fetch(`http://localhost:2024/history/${currentSessionId}`, {
          method: 'GET',
          headers: { 'X-API-Key': apiKey }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            // Process the last message to see if should set the PDF page
            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg.role === 'assistant') {
              const { sources } = processContentForSources(lastMsg.content);

              const cleanedMessages = data.messages.map((msg: Message) => {
                if (msg.role === 'assistant') {
                  const { cleanedContent } = processContentForSources(msg.content);
                  return { ...msg, content: cleanedContent };
                }
                return msg;
              });

              setMessages(cleanedMessages);
              if (sources.length > 0) {
                setPdfSources(sources);
                setPdfPage(sources[0].page);
              }

            } else {
              setMessages(data.messages);
            }
          } else {
            setMessages([{ role: 'assistant', content: 'Hello! I am your Thailand Guide. Ask me anything about traveling in Thailand!' }]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [currentSessionId, apiKey]);


  const handleCreateNewChat = () => {
    const newId = crypto.randomUUID();
    setCurrentSessionId(newId);
    setMessages([{ role: 'assistant', content: 'Hello! I am your Thailand Guide. Ask me anything about traveling in Thailand!' }]);
    setPdfPage(null);
    setPdfSources([]);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat permanently?")) return;

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);

    if (id === currentSessionId) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        handleCreateNewChat();
      }
    }

    if (apiKey) {
      try {
        await fetch(`http://localhost:2024/thread/${id}`, {
          method: 'DELETE',
          headers: { 'X-API-Key': apiKey }
        });
      } catch (err) {
        console.error("Failed to delete thread", err);
        fetchSessions(); // Revert on error
      }
    }
  };

  const handleSaveApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('travai_api_key', key);
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      alert("Please enter your API Key in settings.");
      setShowSettings(true);
      return;
    }

    const isNewSession = !sessions.find(s => s.id === currentSessionId);

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('http://localhost:2024/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          messages: [userMessage],
          thread_id: currentSessionId
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      if (isNewSession) {
        const title = currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '');
        await updateThreadTitle(currentSessionId, title);
        fetchSessions();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          // Stream finished. Final processing for source JSON.
          const { cleanedContent, sources } = processContentForSources(aiContent);
          if (sources.length > 0) {
            setPdfSources(sources);
            setPdfPage(sources[0].page);
          }

          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'assistant', content: cleanedContent };
            return newMsgs;
          });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            try {
              if (dataStr === '{}') continue;
              const data = JSON.parse(dataStr);

              if (typeof data.content === 'string') {
                aiContent += data.content;
              }

              if (aiContent) {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { role: 'assistant', content: aiContent };
                  return newMsgs;
                });
              }
            } catch (e) {
              console.warn("Error parsing chunk:", e);
            }
          }
        }
      }

    } catch (error) {
      console.error("Streaming error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        const errMsg = error instanceof Error ? error.message : String(error);
        newMsgs[newMsgs.length - 1] = { role: 'assistant', content: `**Error:** ${errMsg}` };
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 font-sans">

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-[260px] min-w-[260px]' : 'w-0 min-w-0'}
        bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden relative
      `}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 hover:bg-gray-200 p-1 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-4">
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 shadow-sm transition-colors"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="text-xs font-semibold text-gray-400 px-2 py-2 uppercase tracking-wider">Recent</div>
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`
                group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm
                ${currentSessionId === session.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare size={14} />
                <span className="truncate max-w-[140px]">{session.title}</span>
              </div>

              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Settings Area */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full"
          >
            <Settings size={16} /> API Settings
          </button>
        </div>
      </div>


      {/* Main Content Area (Chat + PDF) */}
      <div className="flex-1 flex flex-row relative h-full overflow-hidden">

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative h-full min-w-[400px]">

          {/* Top Bar */}
          <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-100 bg-white z-10">
            <div className="flex items-center gap-2">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-gray-500 hover:bg-gray-100 p-1 rounded-md"
                >
                  <Menu size={20} />
                </button>
              )}
              <span className="font-semibold text-gray-700">Travai Guide</span>
            </div>
          </div>

          {/* Settings Modal (Overlay) */}
          {showSettings && (
            <div className="absolute top-16 right-4 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Configuration</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">API KEY</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Key size={14} className="text-gray-400 mr-2" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={handleSaveApiKey}
                    placeholder="sk-..."
                    className="bg-transparent border-none text-sm w-full focus:outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto pt-8 pb-32">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
            <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-2xl shadow-sm flex items-center p-2 focus-within:ring-1 focus-within:ring-gray-300 transition-shadow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-none px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className={`
                    p-2 rounded-xl transition-all duration-200
                    ${isLoading || !input.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 shadow-md'}
                `}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-3 text-xs text-gray-400">
              Travai Guide can make mistakes. Check sources provided.
            </div>
          </div>
        </div>

        {/* PDF Viewer (Right Side) */}
        {pdfUrl && pdfSources.length > 0 &&
          <div className="w-[40%] min-w-75 h-full hidden md:block">
            <PDFViewer
              fileUrl={pdfUrl}
              pageNumber={pdfPage}
              sources={pdfSources}
              onPageChange={setPdfPage}
            />
          </div>}

      </div>
    </div>
  );
}

export default App;
