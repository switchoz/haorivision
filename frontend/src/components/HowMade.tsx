/**
 * HAORI VISION — How Made Component (P16 Trust Blocks)
 *
 * Displays a short video showing the craftsmanship process.
 * Part of Trust Blocks system to increase conversion on product pages.
 *
 * Features:
 * - 10-15s silent autoplay video
 * - Muted, looping playback
 * - Responsive design
 * - Graceful fallback if video fails to load
 *
 * Usage:
 *   import HowMade from '@/components/HowMade';
 *
 *   <HowMade />
 */

import { useState } from "react";

interface HowMadeProps {
  videoSrc?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function HowMade({
  videoSrc = "/media/how_made/clip.mp4",
  title = "Процесс создания",
  subtitle = "Каждое изделие создаётся вручную с вниманием к деталям",
  className = "",
}: HowMadeProps) {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className={`how-made ${className}`}>
      <div className="how-made__container">
        {/* Header */}
        <div className="how-made__header">
          <h2 className="how-made__title">{title}</h2>
          <p className="how-made__subtitle">{subtitle}</p>
        </div>

        {/* Video Block */}
        <div className="how-made__video-wrapper">
          {!videoError ? (
            <video
              className="how-made__video"
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoError(true)}
              aria-label="Видео процесса создания изделий HAORI VISION"
            >
              <p>
                Ваш браузер не поддерживает видео. Обновите браузер для лучшего
                опыта.
              </p>
            </video>
          ) : (
            <div className="how-made__fallback">
              <div className="how-made__fallback-icon">🎬</div>
              <p className="how-made__fallback-text">
                Видео недоступно. Скоро добавим!
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="how-made__info">
          <div className="how-made__info-item">
            <span className="how-made__info-label">Ручная работа</span>
            <span className="how-made__info-value">100%</span>
          </div>
          <div className="how-made__info-item">
            <span className="how-made__info-label">Время создания</span>
            <span className="how-made__info-value">2-4 недели</span>
          </div>
          <div className="how-made__info-item">
            <span className="how-made__info-label">Контроль качества</span>
            <span className="how-made__info-value">На каждом этапе</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .how-made {
          width: 100%;
          padding: 4rem 2rem;
          background: linear-gradient(180deg, #18181b 0%, #27272a 100%);
        }

        .how-made__container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .how-made__header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .how-made__title {
          font-size: 2.5rem;
          font-weight: 300;
          color: #ffffff;
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
        }

        .how-made__subtitle {
          font-size: 1.125rem;
          color: #a1a1aa;
          max-width: 600px;
          margin: 0 auto;
        }

        .how-made__video-wrapper {
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto 3rem;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .how-made__video {
          width: 100%;
          height: auto;
          display: block;
          background: #000;
        }

        .how-made__fallback {
          aspect-ratio: 16 / 9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #27272a;
          color: #a1a1aa;
        }

        .how-made__fallback-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .how-made__fallback-text {
          font-size: 1.125rem;
        }

        .how-made__info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .how-made__info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem;
          background: #27272a;
          border-radius: 8px;
          border: 1px solid #3f3f46;
        }

        .how-made__info-label {
          font-size: 0.875rem;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .how-made__info-value {
          font-size: 1.25rem;
          color: #ffffff;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .how-made {
            padding: 3rem 1.5rem;
          }

          .how-made__title {
            font-size: 2rem;
          }

          .how-made__subtitle {
            font-size: 1rem;
          }

          .how-made__info {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
