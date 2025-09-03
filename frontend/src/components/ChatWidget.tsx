"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageCircle, Moon, Sun } from "lucide-react";

type Message = {
  sender: string;
  text: string;
  time: string;
  streaming?: boolean; // ✅ for streaming replies
};

export default function ChatWidget() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/chat/ws");

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    if (data.type === "chunk") {
      // mark typing off because chunk started
      setIsTyping(false);
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].sender === "ai" && prev[prev.length - 1].streaming) {
          // append chunk to last AI message
          const updated = [...prev];
          updated[updated.length - 1].text += data.text;
          return updated;
        }
        // new streaming AI message
        return [
          ...prev,
          {
            sender: "ai",
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            streaming: true,
          },
        ];
      });
    } else if (data.type === "end") {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].sender === "ai") {
          updated[updated.length - 1].streaming = false;
          updated[updated.length - 1].text = data.reply; // clean reply without JSON
        }
        return updated;
      });
      setSuggestions(data.suggestions || []);
    }
  } catch (err) {
    console.error("Invalid WS message", err);
  }
};



    setWs(socket);
    return () => socket.close();
  }, []);

  // ✅ Auto-scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = () => {
  if (ws && input.trim() !== "") {
    ws.send(input);
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
    setIsTyping(true); // only true after sending
    setSuggestions([]);
  }
};

  return (
    <div>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 p-4 rounded-full shadow-xl text-white"
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className={`fixed bottom-20 right-6 w-96 rounded-2xl flex flex-col overflow-hidden border shadow-2xl ${
              darkMode
                ? "bg-gray-900 text-white border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-blue-600 text-white">
              <h2 className="font-semibold">AI Support Assistant</h2>
              <div className="flex gap-2">
                <button onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 max-h-80"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar */}
                  {m.sender === "ai" && <span className="text-2xl">🤖</span>}
                  <div
                    className={`max-w-xs md:max-w-sm px-4 py-2 rounded-xl text-sm shadow whitespace-pre-wrap break-words ${
                      m.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : darkMode
                        ? "bg-gray-700 text-white rounded-bl-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {m.text}
                    <div className="text-xs mt-1 opacity-70">{m.time}</div>
                  </div>
                  {m.sender === "user" && <span className="text-2xl">🙂</span>}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  🤖 <span className="typing-dots">Typing</span>
                </div>
              )}
            </div>

            {/* ✅ Dynamic Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex gap-2 px-3 py-2 overflow-x-auto">
                {suggestions.map((reply, idx) => (
                  <button
                  key={idx}
                  onClick={() => {
                    setInput(reply);
                    sendMessage();
                  }}
                  className={`text-sm px-3 py-1 rounded-full whitespace-nowrap transition-colors shadow-sm
                    ${
                      darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-500"   
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
>
        {reply}
      </button>
    ))}
  </div>
)}

            {/* Input */}
            <div className="flex items-center border-t p-3">
              <input
                className={`flex-1 border rounded-lg p-2 text-sm outline-none mr-2 transition-colors ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "border-gray-300 text-gray-800"
                }`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing dots animation CSS */}
      <style jsx>{`
        .typing-dots::after {
          content: " .";
          animation: dots 1.5s steps(5, end) infinite;
        }
        @keyframes dots {
          0%,
          20% {
            content: " .";
          }
          40% {
            content: " ..";
          }
          60% {
            content: " ...";
          }
          80%,
          100% {
            content: "";
          }
        }
      `}</style>
    </div>
  );
}
