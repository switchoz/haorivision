/**
 * 🎫 GUEST CHECK-IN
 *
 * QR check-in форма для гостей шоу
 * - Имя, email, согласие на фото/видео
 * - Генерация персонального Light Card (PNG + QR)
 * - Email отправка
 */

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./GuestCheckin.css";

export default function GuestCheckin() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    photoConsent: false,
    language: "ru", // en | ru
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightCard, setLightCard] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.email) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }

    if (!formData.photoConsent) {
      setError("Необходимо согласие на фото/видеосъёмку");
      return;
    }

    setIsSubmitting(true);

    try {
      // Создать guest session
      const response = await fetch("/api/guests/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Ошибка регистрации");
      }

      const data = await response.json();

      // Сохранить Light Card
      setLightCard(data.lightCard);

      if (import.meta.env.DEV) console.log("[Check-in] Success:", data);
    } catch (err) {
      console.error("[Check-in] Error:", err);
      setError("Ошибка регистрации. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadLightCard = () => {
    if (!lightCard) return;

    // Скачать PNG
    const link = document.createElement("a");
    link.href = lightCard.imageUrl;
    link.download = `haori-light-card-${lightCard.guestId}.png`;
    link.click();
  };

  if (lightCard) {
    return (
      <div className="guest-checkin">
        <div className="checkin-success">
          <div className="success-header">
            <h1>✦ ДОБРО ПОЖАЛОВАТЬ В СВЕТ ✦</h1>
            <p className="success-subtitle">Ваша Light Card готова</p>
          </div>

          <div className="light-card-preview">
            <div className="light-card">
              <div className="light-card-bg">
                <div className="card-gradient card-gradient-1"></div>
                <div className="card-gradient card-gradient-2"></div>
              </div>

              <div className="light-card-content">
                <div className="card-header">
                  <h2 className="card-logo">HAORI VISION</h2>
                  <p className="card-subtitle">Затмение света</p>
                </div>

                <div className="card-body">
                  <p className="card-name">{formData.name}</p>
                  <p className="card-date">{new Date().toLocaleDateString()}</p>
                </div>

                <div className="card-qr">
                  <QRCodeSVG
                    value={lightCard.qrData}
                    size={120}
                    level="H"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="transparent"
                  />
                </div>

                <div className="card-footer">
                  <p className="card-id">#{lightCard.guestId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <button onClick={downloadLightCard} className="btn-primary">
              Скачать Light Card
            </button>
            <p className="success-hint">
              Цифровая копия отправлена на вашу почту
            </p>
          </div>

          <div className="success-message">
            <p>
              Light Card отправлена на <strong>{formData.email}</strong>
            </p>
            <p className="message-detail">Покажите эту карту на входе</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-checkin">
      <div className="checkin-container">
        <div className="checkin-header">
          <h1 className="checkin-title">
            <span className="title-line">СВЕТ</span>
            <span className="title-line">ЖДЁТ ВАС</span>
          </h1>
          <p className="checkin-subtitle">HAORI VISION — Регистрация гостей</p>
        </div>

        <form className="checkin-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">Полное имя *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите ваше имя"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Language */}
          <div className="form-group">
            <label htmlFor="language">Язык аудиогида</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          {/* Photo Consent */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="photoConsent"
                checked={formData.photoConsent}
                onChange={handleChange}
                required
              />
              <span className="checkbox-text">
                Я согласен на фото- и видеосъёмку во время шоу *
              </span>
            </label>
          </div>

          {/* Error */}
          {error && <div className="form-error">{error}</div>}

          {/* Submit */}
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? "Регистрация..." : "Войти в свет"}
          </button>
        </form>

        <div className="checkin-footer">
          <p className="footer-text">
            Регистрируясь, вы соглашаетесь с политикой конфиденциальности
          </p>
        </div>
      </div>
    </div>
  );
}
