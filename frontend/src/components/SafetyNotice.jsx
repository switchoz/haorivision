/**
 * ⚠️ SAFETY NOTICE
 *
 * Памятка зрителям перед шоу:
 * - Предупреждение о мерцаниях
 * - UV свет (безопасный диапазон)
 * - Выходы из зала
 */

import React, { useState } from "react";
import "./SafetyNotice.css";

export default function SafetyNotice({ onAccept, language = "ru" }) {
  const [accepted, setAccepted] = useState(false);

  const content = {
    en: {
      title: "Safety Notice",
      subtitle: "Please Read Before Entering",
      warnings: [
        {
          icon: "⚡",
          title: "Flashing Lights",
          text: "This show contains intermittent flashing lights and strobing effects (≤3 Hz). If you have photosensitive epilepsy, please consult staff.",
        },
        {
          icon: "💜",
          title: "UV Light",
          text: "We use ultraviolet (UV-A) light effects. UV-A is safe for skin and eyes at our intensity levels. The show duration is 5 minutes.",
        },
        {
          icon: "🚪",
          title: "Exits",
          text: "Emergency exits are marked with green signs. If you feel uncomfortable at any time, please exit calmly and notify staff.",
        },
        {
          icon: "🎧",
          title: "Audio Levels",
          text: "The show features immersive audio. If the volume is uncomfortable, earplugs are available at the entrance.",
        },
      ],
      checkboxText: "I have read and understand the safety information",
      buttonText: "Enter the Light",
      footer: "Your safety is our priority. Enjoy the show!",
    },
    ru: {
      title: "Памятка о безопасности",
      subtitle: "Пожалуйста, прочитайте перед входом",
      warnings: [
        {
          icon: "⚡",
          title: "Мерцающий свет",
          text: "Шоу содержит прерывистые вспышки света и стробоскопические эффекты (≤3 Гц). Если у вас светочувствительная эпилепсия, пожалуйста, проконсультируйтесь с персоналом.",
        },
        {
          icon: "💜",
          title: "Ультрафиолетовый свет",
          text: "Мы используем ультрафиолетовый (UV-A) свет. UV-A безопасен для кожи и глаз при нашей интенсивности. Продолжительность шоу — 5 минут.",
        },
        {
          icon: "🚪",
          title: "Выходы",
          text: "Аварийные выходы обозначены зелёными знаками. Если вы почувствуете дискомфорт, пожалуйста, спокойно выйдите и сообщите персоналу.",
        },
        {
          icon: "🎧",
          title: "Уровень звука",
          text: "Шоу сопровождается иммерсивным звуком. Если громкость некомфортна, беруши доступны на входе.",
        },
      ],
      checkboxText: "Я прочитал(а) и понимаю информацию о безопасности",
      buttonText: "Войти в свет",
      footer: "Ваша безопасность — наш приоритет. Приятного шоу!",
    },
  };

  const t = content[language] || content.en;

  const handleAccept = () => {
    if (accepted) {
      onAccept && onAccept();
    }
  };

  return (
    <div className="safety-notice">
      <div className="safety-container">
        <div className="safety-header">
          <h1 className="safety-title">{t.title}</h1>
          <p className="safety-subtitle">{t.subtitle}</p>
        </div>

        <div className="safety-warnings">
          {t.warnings.map((warning, index) => (
            <div key={index} className="warning-card">
              <div className="warning-icon">{warning.icon}</div>
              <div className="warning-content">
                <h3 className="warning-title">{warning.title}</h3>
                <p className="warning-text">{warning.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="safety-acceptance">
          <label className="acceptance-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span className="acceptance-text">{t.checkboxText}</span>
          </label>
        </div>

        <button
          className="safety-button"
          onClick={handleAccept}
          disabled={!accepted}
        >
          {t.buttonText}
        </button>

        <div className="safety-footer">
          <p>{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
