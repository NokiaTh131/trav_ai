import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import PDFViewer from './components/PDFViewer';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import { type Message, type ChatSession, type Source, type ToolCall } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Thailand Guide. Ask me anything about traveling in Thailand!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('travai_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const lastScrollRef = useRef(0);

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return localStorage.getItem('travai_current_session_id') || crypto.randomUUID();
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(true);

  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [pdfSources, setPdfSources] = useState<Source[]>([]);
  const pdfUrl = "/thourist_thailand_guide.pdf";

  // Refs for Typewriter Effect
  const streamBufferRef = useRef("");
  const displayedContentRef = useRef("");
  const isNetworkDoneRef = useRef(false);

  // Ref for Tool Calls
  const currentToolCallsRef = useRef<Record<number, ToolCall>>({});
  
  // Ref for AbortController to cancel pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('http://localhost:2024/threads', {
        headers: { 'X-API-Key': apiKey }
      });
      if (res.status === 403) {
        setShowSettings(true);
        return;
      }
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

          const sources: Source[] = data.sources.map((s: any) => ({ page: s.page })).filter((s: any) => s.page !== 1);

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
    const now = Date.now();

    if (now - lastScrollRef.current < 120) return;

    lastScrollRef.current = now;

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }, [messages]);

  const handleViewSources = (sources: Source[]) => {
    setPdfSources(sources);
    if (sources.length > 0) {
      setPdfPage(sources[0].page);
      setIsPdfOpen(true);
    }
  };

  useEffect(() => {
    // Abort any ongoing streaming request when switching sessions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset typewriter state
    setIsLoading(false);
    streamBufferRef.current = "";
    displayedContentRef.current = "";
    isNetworkDoneRef.current = false;

    const loadSession = async () => {
      if (!apiKey) return;

      setPdfPage(null);
      setPdfSources([]);

      try {
        setIsLoading(true);
        console.log("Fetching history for thread:", currentSessionId);
        const response = await fetch(`http://localhost:2024/history/${currentSessionId}`, {
          method: 'GET',
          headers: { 'X-API-Key': apiKey }
        });

        if (response.status === 403) {
          setShowSettings(true);
          setIsLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            // Process the last message to see if should set the PDF page
            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg.role === 'assistant') {
              const { sources } = processContentForSources(lastMsg.content);

              const cleanedMessages = data.messages.map((msg: Message) => {
                if (msg.role === 'assistant') {
                  const { cleanedContent, sources } = processContentForSources(msg.content);
                  return { ...msg, content: cleanedContent, sources };
                }
                return msg;
              });

              setMessages(cleanedMessages);
              if (sources.length > 0) {
                setPdfSources(sources);
                setPdfPage(sources[0].page);
                setIsPdfOpen(true);
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


  // Typewriter Effect Logic
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      const buffer = streamBufferRef.current;
      const displayed = displayedContentRef.current;

      // If we have content to type
      if (displayed.length < buffer.length) {
        // Type 2 characters at a time for good speed (adjustable)
        const nextChunk = buffer.slice(displayed.length, displayed.length + 2);
        displayedContentRef.current += nextChunk;

        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            newMsgs[newMsgs.length - 1] = { ...lastMsg, content: displayedContentRef.current };
          }
          return newMsgs;
        });
      }
      // If typing is caught up AND network is finished
      else if (isNetworkDoneRef.current) {
        clearInterval(interval);

        // Final cleanup & processing
        const finalContent = streamBufferRef.current;
        const { cleanedContent, sources } = processContentForSources(finalContent);

        if (sources.length > 0) {
          setPdfSources(sources);
          setPdfPage(sources[0].page);
          setIsPdfOpen(true);
        }

        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'assistant', content: cleanedContent, sources };
          return newMsgs;
        });

        setIsLoading(false);
        isNetworkDoneRef.current = false;
      }
    }, 10); //tick

    return () => clearInterval(interval);
  }, [isLoading]);

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

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Initialize Typewriter State
    setIsLoading(true);
    streamBufferRef.current = "";
    displayedContentRef.current = "";
    isNetworkDoneRef.current = false;
    currentToolCallsRef.current = {};

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
        }),
        signal: abortController.signal
      });
      
      if (response.status === 403) {
        setShowSettings(true);
        throw new Error("Invalid API Key");
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      if (isNewSession) {
        const title = currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '');
        await updateThreadTitle(currentSessionId, title);
        fetchSessions();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          isNetworkDoneRef.current = true;
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
                streamBufferRef.current += data.content;
              }

              // Handle Tool Calls
              if (data.type === 'tool_call') {
                const { index, name, args } = data;
                if (index !== undefined) {
                  if (!currentToolCallsRef.current[index]) {
                    currentToolCallsRef.current[index] = { name: '', args: '' };
                  }
                  if (name) currentToolCallsRef.current[index].name = name;
                  if (args) currentToolCallsRef.current[index].args += args;

                  // Update state immediately for tools (no typewriter delay needed)
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                      newMsgs[newMsgs.length - 1] = {
                        ...lastMsg,
                        toolCalls: Object.values(currentToolCallsRef.current)
                      };
                    }
                    return newMsgs;
                  });
                }
              }

              // No direct setMessages here for content - handled by useEffect
            } catch (e) {
              console.warn("Error parsing chunk:", e);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Request aborted");
        return;
      }
      console.error("Streaming error:", error);
      setIsLoading(false); // Stop typewriter immediately on error
      setMessages(prev => {
        const newMsgs = [...prev];
        const errMsg = error instanceof Error ? error.message : String(error);
        newMsgs[newMsgs.length - 1] = { role: 'assistant', content: `**Error:** ${errMsg}` };
        return newMsgs;
      });
    } finally {
        abortControllerRef.current = null;
    }
    // removed finally block - isLoading is handled by typewriter effect
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleCreateNewChat}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setShowSettings(!showSettings)}
      />

      {/* Main Content Area (Chat + PDF) */}
      <div className="flex-1 flex flex-row relative h-full overflow-hidden">

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative h-full min-w-100">

          <ChatHeader
            isSidebarOpen={isSidebarOpen}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            hasPdf={pdfSources.length > 0}
            isPdfOpen={isPdfOpen}
            onTogglePdf={() => setIsPdfOpen(!isPdfOpen)}
          />

          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            apiKey={apiKey}
            onApiKeyChange={handleSaveApiKey}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto pt-8 pb-32">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} onViewSources={handleViewSources} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <ChatInput
            input={input}
            isLoading={isLoading}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </div>

        {/* PDF Viewer (Right Side) */}
        {pdfUrl && pdfSources.length > 0 &&
          <div className={`${isPdfOpen ? `w-[40%] min-w-75` : `w-0 min-w-0`} transition-all duration-300 h-full hidden md:block border-l border-gray-200 overflow-hidden`}>
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
