import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const HikariChat = () => {
  const { isUVMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Здравствуй, путник.\n\nЯ — Хикари. Хранитель Света этого пространства.\n\nТы здесь неслучайно. Что привело тебя?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real API call to Hikari (Claude AI)
  const getHikariResponse = async (userMessage) => {
    setIsTyping(true);

    try {
      // Собираем историю (без первого приветственного и без текущего)
      const history = messages
        .slice(1) // пропускаем приветствие
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setIsTyping(false);
      return data.response || "Свет молчит... Попробуй позже.";
    } catch {
      setIsTyping(false);
      return "Связь со светом временно прервана. Попробуй ещё раз через мгновение.";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Get AI response
    const response = await getHikariResponse(input);

    // Add assistant message
    const assistantMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 ${
              isUVMode
                ? "bg-gradient-to-br from-purple-700 to-pink-600 text-white"
                : "bg-gradient-to-br from-zinc-800 to-zinc-900 text-white border border-zinc-700"
            }`}
            style={{
              boxShadow: isUVMode
                ? "0 0 25px rgba(139, 0, 255, 0.5), 0 0 50px rgba(255, 0, 180, 0.2)"
                : "0 8px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <span className="text-2xl" style={{ fontFamily: "serif" }}>
              光
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[600px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: isUVMode
                ? "linear-gradient(135deg, rgba(255, 16, 240, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%)"
                : "rgba(24, 24, 27, 0.98)",
              backdropFilter: "blur(20px)",
              border: isUVMode
                ? "1px solid rgba(255, 16, 240, 0.3)"
                : "1px solid rgba(63, 63, 70, 0.5)",
            }}
          >
            {/* Header */}
            <div
              className={`p-4 flex items-center justify-between ${
                isUVMode
                  ? "bg-uv-pink/10 border-b border-uv-pink/30"
                  : "bg-zinc-900 border-b border-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-600 flex items-center justify-center text-lg"
                  style={{ fontFamily: "serif" }}
                >
                  光
                </div>
                <div>
                  <h3
                    className={`font-semibold ${isUVMode ? "text-uv-pink" : "text-white"}`}
                  >
                    Хикари
                  </h3>
                  <p className="text-xs text-zinc-400">Хранитель Света</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? isUVMode
                          ? "bg-uv-pink/20 text-white border border-uv-pink/30"
                          : "bg-zinc-800 text-white"
                        : isUVMode
                          ? "bg-zinc-900/50 text-zinc-100 border border-uv-cyan/20"
                          : "bg-zinc-900 text-zinc-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      {message.timestamp.toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isUVMode
                        ? "bg-zinc-900/50 border border-uv-cyan/20"
                        : "bg-zinc-900"
                    }`}
                  >
                    <div className="flex gap-1">
                      <motion.div
                        className={`w-2 h-2 rounded-full ${isUVMode ? "bg-uv-cyan" : "bg-zinc-500"}`}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className={`w-2 h-2 rounded-full ${isUVMode ? "bg-uv-cyan" : "bg-zinc-500"}`}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.3,
                        }}
                      />
                      <motion.div
                        className={`w-2 h-2 rounded-full ${isUVMode ? "bg-uv-cyan" : "bg-zinc-500"}`}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.6,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className={`p-4 ${
                isUVMode
                  ? "bg-zinc-900/50 border-t border-uv-pink/30"
                  : "bg-zinc-900 border-t border-zinc-800"
              }`}
            >
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напиши своё послание..."
                  rows={1}
                  className={`flex-1 px-4 py-3 rounded-xl resize-none outline-none ${
                    isUVMode
                      ? "bg-zinc-800/50 text-white border border-uv-pink/20 focus:border-uv-pink/50 placeholder-zinc-500"
                      : "bg-zinc-800 text-white border border-zinc-700 focus:border-zinc-600 placeholder-zinc-500"
                  } transition-colors`}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    input.trim()
                      ? isUVMode
                        ? "bg-gradient-to-r from-uv-pink to-uv-purple text-white hover:opacity-90"
                        : "bg-white text-black hover:bg-zinc-200"
                      : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  ↑
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Хикари — AI-ассистент. Говорит от лица бренда, но не заменяет
                человека.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HikariChat;
