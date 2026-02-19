'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ConciergeResponse, MenuItem } from '@/lib/types';
import { useGroupSession } from '@/store/groupSession';

interface Message {
  role: 'user' | 'bot';
  text: string;
  items?: MenuItem[];
  upsells?: MenuItem[];
  suggestions?: string[];
}

interface Props {
  onAddToCart: (item: MenuItem) => void;
  onClose: () => void;
}

export default function ConciergeChat({ onAddToCart, onClose }: Props) {
  const { groupId } = useGroupSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, groupId, isGroupSession: !!groupId }),
      });
      const data: ConciergeResponse = await res.json();
      const botMsg: Message = {
        role: 'bot',
        text: data.text,
        items: data.menuItems,
        upsells: data.upsells,
        suggestions: data.suggestions,
      };
      setMessages((m) => [...m, botMsg]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I had trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Greet on first open
  useEffect(() => {
    if (!hasGreeted) {
      setHasGreeted(true);
      sendMessage('hello');
    }
  }, [hasGreeted, sendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xl">🎩</div>
          <div>
            <p className="font-bold text-sm">Food Hall Concierge</p>
            <p className="text-purple-200 text-xs">Ask about allergens, pairings & more</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              {msg.role === 'bot' && (
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-lg mt-0.5">🎩</span>
                  <div className="flex-1 space-y-2">
                    {/* Text bubble */}
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-800 shadow-sm">
                      <p dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    </div>

                    {/* Menu item cards */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.items.map((item) => (
                          <MenuItemCard key={item.id} item={item} onAdd={onAddToCart} />
                        ))}
                      </div>
                    )}

                    {/* Upsells */}
                    {msg.upsells && msg.upsells.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1 ml-1">✨ Perfect pairings</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.upsells.map((item) => (
                            <MenuItemCard key={item.id} item={item} onAdd={onAddToCart} compact />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((s, si) => (
                          <button
                            key={si}
                            onClick={() => sendMessage(s)}
                            className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full hover:bg-purple-100 transition"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm shadow-sm">
                  {msg.text}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <span className="text-lg">🎩</span>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3 flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about allergens, pairings…"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center font-bold disabled:opacity-50 hover:opacity-90 transition"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}

function MenuItemCard({ item, onAdd, compact = false }: { item: MenuItem; onAdd: (item: MenuItem) => void; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden ${compact ? 'flex items-center gap-2 px-3 py-2' : 'p-3'}`}>
      {compact ? (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
            <p className="text-xs text-gray-400">{item.vendor?.name}</p>
          </div>
          <span className="text-xs font-bold text-purple-700 flex-shrink-0">£{item.price.toFixed(2)}</span>
          <AddBtn item={item} onAdd={onAdd} added={added} setAdded={setAdded} compact />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-sm text-gray-800">{item.name}</p>
            <span className="font-bold text-sm text-purple-700 flex-shrink-0">£{item.price.toFixed(2)}</span>
          </div>
          {item.vendor?.name && <p className="text-xs text-gray-400 mb-1">{item.vendor.name}</p>}
          {item.dietary?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.dietary.map((d) => (
                <span key={d} className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">{d}</span>
              ))}
            </div>
          )}
          {item.allergens?.length > 0 && (
            <p className="text-xs text-amber-600 mb-2">⚠️ Contains: {item.allergens.join(', ')}</p>
          )}
          <AddBtn item={item} onAdd={onAdd} added={added} setAdded={setAdded} />
        </>
      )}
    </div>
  );
}

function AddBtn({ item, onAdd, added, setAdded, compact = false }: { item: MenuItem; onAdd: (item: MenuItem) => void; added: boolean; setAdded: (v: boolean) => void; compact?: boolean }) {
  return (
    <button
      onClick={() => {
        onAdd(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className={`${compact ? 'text-xs px-2 py-1' : 'w-full mt-2 py-2 text-sm font-medium'} rounded-lg transition-all ${added ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
    >
      {added ? (compact ? '✓' : '✓ Added') : compact ? '+' : '+ Add to cart'}
    </button>
  );
}
