import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MessageCircle, FileText, Image, Smile } from 'lucide-react';
import { listenToMessages, sendMessage } from '../lib/dbService';
import { Message } from '../types';
import AestheticFileUploader from './AestheticFileUploader';

interface ChatWindowProps {
  orderId: string;
  senderId: string;
  senderName: string;
  placeholder?: string;
}

export default function ChatWindow({ orderId, senderId, senderName, placeholder = "Type a message or paste a link..." }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to real-time message stream
    const unsubscribe = listenToMessages(orderId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachmentUrl.trim()) return;

    try {
      await sendMessage(
        orderId,
        senderId,
        senderName,
        inputText.trim(),
        attachmentUrl.trim() || undefined
      );
      setInputText('');
      setAttachmentUrl('');
      setShowAttachInput(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const insertQuickRef = (url: string) => {
    setAttachmentUrl(url);
    setShowAttachInput(true);
  };

  return (
    <div id={`chat-window-${orderId}`} className="flex flex-col h-[500px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
      {/* CHAT HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
            {senderName.substring(0, 2)}
          </div>
          <div>
            <h4 className="font-sans font-semibold text-xs text-neutral-800 dark:text-neutral-100">Project Collaboration Chat</h4>
            <p className="text-4xs text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">Real-time sync active • Secured</p>
          </div>
        </div>
      </div>

      {/* MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/50 dark:bg-neutral-950/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-2" />
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">No messages yet</p>
            <p className="text-3xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-[200px]">
              Discuss brief parameters, request revisions, or share files directly here.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === senderId;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender name label */}
                <span className="text-4xs text-neutral-400 dark:text-neutral-500 font-mono mb-1 px-1">
                  {msg.senderName} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>

                {/* Message Bubble */}
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    isMe 
                      ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-tr-none' 
                      : 'bg-white text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                  
                  {msg.fileUrl && (
                    <div className="mt-2.5 pt-2 border-t border-current/15">
                      <a 
                        href={msg.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-3xs font-mono font-bold tracking-wide uppercase hover:underline ${
                          isMe ? 'text-amber-400 dark:text-neutral-900' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                          <Image className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        Open Attached Reference
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT ATTACHMENT TRAY */}
      {showAttachInput && (
        <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-3 shrink-0 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-amber-500" />
              Upload project assets
            </span>
            <button 
              id="close-attachment-tray"
              onClick={() => { setShowAttachInput(false); setAttachmentUrl(''); }}
              className="text-4xs font-mono uppercase text-red-500 hover:underline cursor-pointer"
            >
              Cancel Attachment
            </button>
          </div>

          <AestheticFileUploader 
            id="chat-uploader"
            placeholderText="Upload from Internal Storage or import from Google Drive"
            onFileSelected={(url, name) => {
              setAttachmentUrl(url);
            }}
          />

          <div className="flex items-center gap-2">
            <input 
              id="chat-attachment-input"
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="Paste backup asset link or URL auto-populates here"
              className="flex-1 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-mono text-[10px]"
            />
          </div>
        </div>
      )}

      {/* CHAT FORM CONTAINER */}
      <form 
        onSubmit={handleSend}
        className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center gap-2 shrink-0"
      >
        <button 
          id="toggle-attachment-input"
          type="button"
          onClick={() => setShowAttachInput(!showAttachInput)}
          className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
            showAttachInput ? 'text-amber-500 bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 dark:text-neutral-500'
          }`}
          title="Add photo/video link attachment"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input 
          id="chat-message-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:placeholder-neutral-500"
        />

        {/* Quick sample file links helper for demonstration purposes */}
        {inputText === '' && !showAttachInput && (
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertQuickRef('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1200')}
              className="px-2 py-1 text-4xs font-mono bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded cursor-pointer"
            >
              + Photo Link
            </button>
            <button
              type="button"
              onClick={() => insertQuickRef('https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4')}
              className="px-2 py-1 text-4xs font-mono bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded cursor-pointer"
            >
              + Video Link
            </button>
          </div>
        )}

        <button 
          id="chat-send-btn"
          type="submit"
          className="p-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 shadow-md transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
          disabled={!inputText.trim() && !attachmentUrl.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
