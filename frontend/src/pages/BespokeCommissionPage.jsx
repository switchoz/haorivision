import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3010";

/**
 * Bespoke Commission Page - "Создать свой свет"
 */

export default function BespokeCommissionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1-5
  const [brief, setBrief] = useState({
    energy: "",
    colors: [],
    emotions: [],
    style: "",
    inspiration: "",
    story: "",
    garmentType: "haori",
    size: "",
  });

  const [moodboard, setMoodboard] = useState(null);
  const [consultationDate, setConsultationDate] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Get customer ID (from localStorage or auth)
      const customerId =
        localStorage.getItem("hv_customer_id") || "demo_customer";

      // Submit commission
      const response = await fetch(`${API_URL}/api/bespoke/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId,
          brief: brief,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show moodboard
        setMoodboard(data.commission.moodboard);
        setPricing(data.commission.pricing);
        setStep(6); // Success step
      }

      setSubmitting(false);
    } catch (error) {
      console.error("Submit commission error:", error);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            Создать свой свет
          </h1>

          <p className="text-xl text-purple-300 mb-8">
            Bespoke Commission: Индивидуальная хаори, созданная специально для
            тебя
          </p>

          {/* Progress Bar */}
          {step <= totalSteps && (
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s <= step ? "w-16 bg-purple-500" : "w-8 bg-gray-700"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1_Energy
              brief={brief}
              setBrief={setBrief}
              onNext={handleNext}
            />
          )}

          {step === 2 && (
            <Step2_Colors
              brief={brief}
              setBrief={setBrief}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <Step3_Emotions
              brief={brief}
              setBrief={setBrief}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 4 && (
            <Step4_Story
              brief={brief}
              setBrief={setBrief}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 5 && (
            <Step5_Specifications
              brief={brief}
              setBrief={setBrief}
              onSubmit={handleSubmit}
              onBack={handleBack}
              submitting={submitting}
            />
          )}

          {step === 6 && (
            <Step6_Moodboard
              moodboard={moodboard}
              pricing={pricing}
              commissionNumber={moodboard?.commissionNumber}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 1: Energy
function Step1_Energy({ brief, setBrief, onNext }) {
  const energyOptions = [
    { value: "calm", label: "Calm & Peaceful", icon: "🌊" },
    { value: "bold", label: "Bold & Powerful", icon: "⚡" },
    { value: "mysterious", label: "Mysterious & Dark", icon: "🌑" },
    { value: "joyful", label: "Joyful & Bright", icon: "✨" },
    { value: "ethereal", label: "Ethereal & Dreamy", icon: "☁️" },
  ];

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">
        Какую энергию ты хочешь носить?
      </h2>

      <p className="text-gray-400 text-center mb-8">
        Выбери энергию, которая резонирует с твоей сущностью
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {energyOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setBrief({ ...brief, energy: option.label })}
            className={`p-8 rounded-2xl border-2 transition-all text-left ${
              brief.energy === option.label
                ? "border-purple-500 bg-purple-500/20"
                : "border-purple-500/30 bg-white/5 hover:border-purple-500/60"
            }`}
          >
            <div className="text-5xl mb-4">{option.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {option.label}
            </h3>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onNext}
          disabled={!brief.energy}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl text-lg font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </motion.div>
  );
}

// Step 2: Colors
function Step2_Colors({ brief, setBrief, onNext, onBack }) {
  const colorOptions = [
    { name: "Deep Purple", hex: "#7c3aed" },
    { name: "Electric Blue", hex: "#3b82f6" },
    { name: "Neon Pink", hex: "#ec4899" },
    { name: "Lime Green", hex: "#84cc16" },
    { name: "Sunset Orange", hex: "#f97316" },
    { name: "Midnight Black", hex: "#0a0a0a" },
    { name: "Pure White", hex: "#ffffff" },
    { name: "Gold", hex: "#eab308" },
  ];

  const toggleColor = (color) => {
    const colors = brief.colors || [];
    if (colors.includes(color)) {
      setBrief({ ...brief, colors: colors.filter((c) => c !== color) });
    } else {
      setBrief({ ...brief, colors: [...colors, color] });
    }
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">
        Какие цвета вызывают эмоции?
      </h2>

      <p className="text-gray-400 text-center mb-8">
        Выбери 2-5 цветов для UV-реактивной палитры
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {colorOptions.map((color) => (
          <button
            key={color.name}
            onClick={() => toggleColor(color.name)}
            className={`p-6 rounded-xl border-2 transition-all ${
              (brief.colors || []).includes(color.name)
                ? "border-purple-500 bg-purple-500/20 scale-105"
                : "border-gray-700 bg-white/5 hover:border-purple-500/60"
            }`}
          >
            <div
              className="w-full h-20 rounded-lg mb-3"
              style={{ backgroundColor: color.hex }}
            />
            <p className="text-sm text-white text-center">{color.name}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
        >
          ← Назад
        </button>

        <button
          onClick={onNext}
          disabled={(brief.colors || []).length < 2}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl text-lg font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </motion.div>
  );
}

// Step 3: Emotions
function Step3_Emotions({ brief, setBrief, onNext, onBack }) {
  const emotionOptions = [
    "Peace",
    "Wonder",
    "Power",
    "Joy",
    "Mystery",
    "Freedom",
    "Love",
    "Courage",
    "Serenity",
    "Passion",
  ];

  const toggleEmotion = (emotion) => {
    const emotions = brief.emotions || [];
    if (emotions.includes(emotion)) {
      setBrief({ ...brief, emotions: emotions.filter((e) => e !== emotion) });
    } else {
      if (emotions.length < 5) {
        setBrief({ ...brief, emotions: [...emotions, emotion] });
      }
    }
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">
        Какие эмоции ты хочешь воплотить?
      </h2>

      <p className="text-gray-400 text-center mb-8">Выбери до 5 эмоций</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {emotionOptions.map((emotion) => (
          <button
            key={emotion}
            onClick={() => toggleEmotion(emotion)}
            className={`p-4 rounded-xl border-2 transition-all ${
              (brief.emotions || []).includes(emotion)
                ? "border-purple-500 bg-purple-500/20"
                : "border-gray-700 bg-white/5 hover:border-purple-500/60"
            }`}
          >
            <p className="text-white text-center">{emotion}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
        >
          ← Назад
        </button>

        <button
          onClick={onNext}
          disabled={(brief.emotions || []).length === 0}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl text-lg font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </motion.div>
  );
}

// Step 4: Story
function Step4_Story({ brief, setBrief, onNext, onBack }) {
  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">
        Расскажи свою историю
      </h2>

      <p className="text-gray-400 text-center mb-8">
        Что вдохновляет тебя? Какая история стоит за этим заказом?
      </p>

      <div className="space-y-6 mb-12">
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Источник вдохновения
          </label>
          <input
            type="text"
            value={brief.inspiration}
            onChange={(e) =>
              setBrief({ ...brief, inspiration: e.target.value })
            }
            placeholder="Например: ночное небо, биолюминесценция океана..."
            className="w-full px-4 py-3 bg-white/10 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Личная история
          </label>
          <textarea
            value={brief.story}
            onChange={(e) => setBrief({ ...brief, story: e.target.value })}
            placeholder="Почему ты хочешь создать эту хаори? Что она будет значить для тебя?"
            rows={6}
            className="w-full px-4 py-3 bg-white/10 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Стиль
          </label>
          <div className="grid grid-cols-3 gap-4">
            {["Minimalist", "Bold", "Ethereal"].map((style) => (
              <button
                key={style}
                onClick={() => setBrief({ ...brief, style: style })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  brief.style === style
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-gray-700 bg-white/5 hover:border-purple-500/60"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
        >
          ← Назад
        </button>

        <button
          onClick={onNext}
          disabled={!brief.inspiration || !brief.story || !brief.style}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl text-lg font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </motion.div>
  );
}

// Step 5: Specifications
function Step5_Specifications({
  brief,
  setBrief,
  onSubmit,
  onBack,
  submitting,
}) {
  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">
        Финальные детали
      </h2>

      <div className="space-y-6 mb-12">
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Тип изделия
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "haori", label: "Haori только" },
              { value: "haori_set", label: "Haori + Painting Set" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setBrief({ ...brief, garmentType: option.value })
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  brief.garmentType === option.value
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-gray-700 bg-white/5 hover:border-purple-500/60"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Размер
          </label>
          <div className="grid grid-cols-5 gap-4">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                onClick={() => setBrief({ ...brief, size: size })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  brief.size === size
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-gray-700 bg-white/5 hover:border-purple-500/60"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
        >
          ← Назад
        </button>

        <button
          onClick={onSubmit}
          disabled={!brief.size || submitting}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl text-lg font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Создаём твой свет..." : "Создать заказ ✨"}
        </button>
      </div>
    </motion.div>
  );
}

// Step 6: Moodboard & Success
function Step6_Moodboard({ moodboard, pricing }) {
  if (!moodboard) return null;

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="text-center mb-12">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-4xl font-bold text-purple-300 mb-4">
          Твой Light создан!
        </h2>
        <p className="text-gray-400 text-lg">
          AI сгенерировал персональный moodboard для твоей bespoke хаори
        </p>
      </div>

      {/* Color Palette */}
      <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8 mb-8">
        <h3 className="text-2xl font-semibold text-purple-300 mb-6">
          🎨 Color Palette
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {moodboard.colorPalette.map((color, i) => (
            <div key={i} className="text-center">
              <div
                className="w-full h-20 rounded-lg mb-2"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-xs text-gray-400">{color.name}</p>
              {color.uvReactive && (
                <p className="text-xs text-purple-400">UV ✨</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8 mb-8">
        <h3 className="text-2xl font-semibold text-purple-300 mb-4">
          💡 AI Analysis
        </h3>
        <p className="text-gray-300 leading-relaxed">{moodboard.aiAnalysis}</p>
      </div>

      {/* Suggestions */}
      <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8 mb-8">
        <h3 className="text-2xl font-semibold text-purple-300 mb-4">
          ✍️ Design Suggestions
        </h3>
        <ul className="space-y-3">
          {moodboard.aiSuggestions.map((suggestion, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-purple-400">•</span>
              <span className="text-gray-300">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing */}
      {pricing && (
        <div className="bg-gradient-to-r from-purple-900/30 to-violet-900/30 border border-purple-500/30 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-semibold text-purple-300 mb-6 text-center">
            Pricing Estimate
          </h3>

          <div className="space-y-3 text-center">
            <p className="text-gray-400">
              Base Price:{" "}
              <span className="text-white">${pricing.basePrice}</span>
            </p>
            <p className="text-gray-400">
              Complexity:{" "}
              <span className="text-purple-300">
                ×{pricing.complexityMultiplier}
              </span>
            </p>
            <p className="text-3xl font-bold text-white mt-4">
              ${pricing.totalPrice}
            </p>
            <p className="text-sm text-gray-500">
              50% deposit required: ${pricing.depositRequired}
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="text-center">
        <p className="text-gray-400 mb-6">
          Мы отправили детали на твой email. Художник свяжется с тобой в течение
          24 часов для консультации.
        </p>

        <a
          href="/"
          className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
        >
          Вернуться на главную
        </a>
      </div>
    </motion.div>
  );
}
