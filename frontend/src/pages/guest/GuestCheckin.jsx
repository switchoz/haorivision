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
    language: "en", // en | ru
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
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.photoConsent) {
      setError("Please agree to photo/video consent");
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
        throw new Error("Check-in failed");
      }

      const data = await response.json();

      // Сохранить Light Card
      setLightCard(data.lightCard);

      if (import.meta.env.DEV) console.log("[Check-in] Success:", data);
    } catch (err) {
      console.error("[Check-in] Error:", err);
      setError("Check-in failed. Please try again.");
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
            <h1>✦ WELCOME TO THE LIGHT ✦</h1>
            <p className="success-subtitle">Your Light Card is ready</p>
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
                  <p className="card-subtitle">Eclipse of Light</p>
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
              Download Light Card
            </button>
            <p className="success-hint">
              Check your email for the digital copy
            </p>
          </div>

          <div className="success-message">
            <p>
              Your Light Card has been sent to <strong>{formData.email}</strong>
            </p>
            <p className="message-detail">
              Show this card at the venue entrance
            </p>
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
            <span className="title-line">THE LIGHT</span>
            <span className="title-line">AWAITS</span>
          </h1>
          <p className="checkin-subtitle">HAORI VISION — Guest Check-in</p>
        </div>

        <form className="checkin-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
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
            <label htmlFor="language">Audio Guide Language</label>
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
                I agree to be photographed and/or filmed during the show *
              </span>
            </label>
          </div>

          {/* Error */}
          {error && <div className="form-error">{error}</div>}

          {/* Submit */}
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? "Checking in..." : "Enter the Light"}
          </button>
        </form>

        <div className="checkin-footer">
          <p className="footer-text">
            By checking in, you agree to our privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
