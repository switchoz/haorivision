import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageMeta from "../components/PageMeta";
import UnboxingExperience from "../components/UnboxingExperience";

/**
 * Unboxing Page - QR код лендинг
 */

export default function UnboxingPage() {
  const { qrCode } = useParams();
  const [packaging, setPackaging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExperience, setShowExperience] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    fetchPackaging();
    trackScan();
  }, [qrCode]);

  const fetchPackaging = async () => {
    try {
      const response = await fetch(`/api/packaging/qr/${qrCode}`);
      const data = await response.json();

      if (data.success) {
        setPackaging(data.packaging);
        setScanned(data.packaging.unboxing.scanned);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load packaging:", error);
      setLoading(false);
    }
  };

  const trackScan = async () => {
    try {
      await fetch(`/api/packaging/scan/${qrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: /mobile|tablet/i.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error("Failed to track scan:", error);
    }
  };

  const handleStartExperience = () => {
    setShowExperience(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!packaging) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">Invalid QR code</div>
      </div>
    );
  }

  if (showExperience) {
    return (
      <UnboxingExperience
        orderId={packaging.orderId}
        product={{
          name: packaging.productId.name,
          tagline: packaging.productId.tagline,
          editionNumber: packaging.printedCard.edition.match(/\d+/)?.[0],
          totalEditions: packaging.printedCard.edition.match(/of (\d+)/)?.[1],
          artistSignature: true,
        }}
        onComplete={() => {
          window.location.href = `/unboxing/${qrCode}/journey`;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      <PageMeta
        title="Распаковка"
        description="Распаковка вашего хаори HAORI VISION. Уникальный опыт первого знакомства."
      />
      <div className="container mx-auto px-6 py-20">
        {/* Welcome Section */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            Your Light Has Arrived
          </h1>

          <p className="text-2xl text-purple-300 mb-8">
            {packaging.productId.name}
          </p>

          <p className="text-gray-400 text-lg leading-relaxed">
            Внутри тубуса ждёт не просто хаори — это артефакт, созданный вручную
            в темноте, чтобы светиться в UV. Твоя индивидуальная edition,
            подпись художника LiZa, твоя история.
          </p>
        </motion.div>

        {/* Card Preview */}
        <motion.div
          className="max-w-2xl mx-auto bg-white/5 border border-purple-500/30 rounded-2xl p-12 mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-purple-300 mb-8">
              HAORI VISION
            </h2>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-8 mb-8">
              <p className="text-lg text-gray-300 leading-relaxed italic">
                "{packaging.printedCard.message}"
              </p>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              {packaging.printedCard.edition}
            </p>

            <p className="text-xs text-purple-400 italic">
              {packaging.printedCard.artistSignature}
            </p>
          </div>
        </motion.div>

        {/* Start Experience Button */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <button
            onClick={handleStartExperience}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full text-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
          >
            ✨ Начать распаковку
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Интерактивная 3D анимация
          </p>
        </motion.div>

        {/* Content Links */}
        <motion.div
          className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          <ContentLinkCard
            icon="✍️"
            title="Подпись художника"
            description="Подлинность подтверждена подписью LiZa"
            href="/about"
          />

          <ContentLinkCard
            icon="🎬"
            title="Creation Story"
            description="Видео о создании твоей хаори"
            href={packaging.content.creationVideoUrl}
          />

          <ContentLinkCard
            icon="✍️"
            title="Artist Story"
            description="Познакомься с художником"
            href={packaging.content.artistStoryUrl}
          />

          <ContentLinkCard
            icon="💧"
            title="Care Instructions"
            description="Как ухаживать за хаори"
            href={packaging.content.careInstructionsUrl}
          />
        </motion.div>

        {/* Scanned Status */}
        {scanned && (
          <motion.div
            className="max-w-2xl mx-auto text-center bg-green-500/10 border border-green-500/30 rounded-xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-green-400">
              ✅ Упаковка уже была открыта{" "}
              {new Date(packaging.unboxing.scannedAt).toLocaleDateString()}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ContentLinkCard({ icon, title, description, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white/5 border border-purple-500/30 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/60 transition-all"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-purple-300 mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </a>
  );
}
