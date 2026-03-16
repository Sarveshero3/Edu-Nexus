"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BrainCircuit, Database, MessageSquare, Send, Network, Clock, Settings, LogOut, Loader2, Sparkles, Search, ChevronRight } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
  
  // Chain of thought metadata
  routerDecision?: { reasoning: string };
  chosenBrains?: string[];
  bm25Chunks?: string[];
  graphTriples?: any[];
  vectorResults?: any[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket("ws://localhost:8000/ws/chat");
    
    ws.current.onopen = () => {
      setIsConnected(true);
      setMessages([{
        id: "sys_1",
        role: "system",
        content: "LLM-Routed Tri-Hybrid Academic Assistant is online. Using Fast Brain (BM25), Semantic Brain (FAISS), and Deep Brain (Neo4j)."
      }]);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "status") {
        setIsTyping(true);
      } else if (data.type === "result") {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: data.answer,
          routerDecision: data.router_decision,
          chosenBrains: data.chosen_brains,
          bm25Chunks: data.bm25_chunks,
          graphTriples: data.graph_triples,
          vectorResults: data.vector_results
        }]);
      }
    };

    ws.current.onclose = () => setIsConnected(false);

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Send to WebSocket server
    ws.current?.send(JSON.stringify({ query: input }));
    setInput("");
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col pt-6 pb-4 flex-shrink-0 bg-background/50 backdrop-blur-xl z-20">
        <Link href="/" className="flex items-center gap-2 px-6 mb-8 w-min">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Edu Nexus</span>
        </Link>
        
        <div className="px-4 flex flex-col gap-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Navigation</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Database className="w-5 h-5" />
            Sources
          </Link>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 font-medium">
            <MessageSquare className="w-5 h-5" />
            Chat Assistant
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Network className="w-5 h-5" />
            Graph Explorer
          </Link>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden bg-slate-900/50">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg">Academic Assistant</h1>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${isConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6 w-full">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* The Message Bubble */}
                  <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : msg.role === 'system' ? 'bg-slate-800/80 text-slate-300 border border-slate-700 text-sm italic' : 'bg-slate-800/60 text-slate-200 border border-slate-700/50 rounded-tl-sm'}`}>
                    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>

                  {/* Chain of Thought / Router Decision */}
                  {msg.role === 'assistant' && msg.routerDecision && (
                    <div className="mt-2 w-full p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col gap-3 max-w-lg shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]">
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                        <BrainCircuit className="w-4 h-4" />
                        Router Reasoning
                      </div>
                      <p className="text-sm text-slate-300 italic pl-6 border-l-2 border-indigo-500/30">
                        "{msg.routerDecision.reasoning}"
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['keyword', 'semantic', 'graph'].map(brain => {
                          const isSelected = msg.chosenBrains?.includes(brain);
                          return (
                            <span key={brain} className={`px-2 py-1 text-xs rounded-md border ${isSelected ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                              {brain} {isSelected && '✓'}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
               <div className="flex gap-4 w-full justify-start">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                   <Sparkles className="w-4 h-4 text-white animate-pulse" />
                 </div>
                 <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                   <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                   <span className="text-sm text-slate-400 font-medium">Synthesizing resources...</span>
                 </div>
               </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full bg-background/80 backdrop-blur-md border-t border-slate-800 relative z-20">
          <div className="max-w-4xl mx-auto p-4 w-full">
            <form onSubmit={handleSend} className="relative flex items-end w-full group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask a question about your documents..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500/50 rounded-xl pl-4 pr-16 py-4 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || !isConnected}
                className="absolute right-3 bottom-3 w-10 h-10 rounded-lg bg-primary hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 text-white flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center mt-3 text-xs text-slate-500">
              Edu Nexus AI can make mistakes. Always cross-reference critical academic claims.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
