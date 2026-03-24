/**
 * HAORI VISION — Lazy Hydration Usage Examples (P24)
 *
 * Примеры использования LazyHydratedVideo и LazyHydrated3D компонентов
 */

import React, { lazy } from "react";
import { LazyHydratedVideo } from "../components/LazyHydratedVideo";
import { LazyHydrated3D, withLazy3D } from "../components/LazyHydrated3D";

// ============================================================
// Example 1: Simple Video with Lazy Loading
// ============================================================

export const HeroVideoExample: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <LazyHydratedVideo
        src="/media/hero/intro.mp4"
        poster="/media/hero/poster.jpg"
        autoplay
        muted
        loop
        threshold={0.1}
        debounce={200}
        onLazyLoad={() => console.log("Hero video loaded!")}
      />
    </div>
  );
};

// ============================================================
// Example 2: Product Video with Controls
// ============================================================

export const ProductVideoExample: React.FC = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <LazyHydratedVideo
        src="/media/products/ECLIPSE-01-demo.mp4"
        poster="/media/products/ECLIPSE-01-poster.jpg"
        controls
        playsInline
        threshold={0.2}
        containerClassName="product-video-container"
      />
    </div>
  );
};

// ============================================================
// Example 3: Gallery Video Grid
// ============================================================

export const GalleryVideosExample: React.FC = () => {
  const videos = [
    {
      id: "uv-transform-1",
      src: "/media/gallery/uv-transform-1.mp4",
      poster: "/media/gallery/uv-transform-1-poster.jpg",
    },
    {
      id: "uv-transform-2",
      src: "/media/gallery/uv-transform-2.mp4",
      poster: "/media/gallery/uv-transform-2-poster.jpg",
    },
    {
      id: "uv-transform-3",
      src: "/media/gallery/uv-transform-3.mp4",
      poster: "/media/gallery/uv-transform-3-poster.jpg",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        padding: "20px",
      }}
    >
      {videos.map((video) => (
        <LazyHydratedVideo
          key={video.id}
          src={video.src}
          poster={video.poster}
          autoplay
          muted
          loop
          threshold={0.15}
          debounce={250}
        />
      ))}
    </div>
  );
};

// ============================================================
// Example 4: 3D Scene with Lazy Loading
// ============================================================

// Mock 3D Scene Component (replace with real Three.js/Canvas component)
const Scene3DMock: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "24px",
        fontWeight: "bold",
      }}
    >
      3D Scene Loaded
    </div>
  );
};

export const Scene3DExample: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <LazyHydrated3D
        threshold={0.2}
        debounce={300}
        rootMargin="100px"
        onLazyLoad={() => console.log("3D scene loaded!")}
      >
        <Scene3DMock />
      </LazyHydrated3D>
    </div>
  );
};

// ============================================================
// Example 5: Lazy Import with React.lazy() + LazyHydrated3D
// ============================================================

// Lazy import heavy 3D component
const Heavy3DScene = lazy(() => import("./Heavy3DScene"));

export const LazyImport3DExample: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <LazyHydrated3D
        threshold={0.3}
        debounce={500}
        rootMargin="200px"
        fallback={
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#000",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading Heavy 3D Scene...
          </div>
        }
      >
        <Heavy3DScene />
      </LazyHydrated3D>
    </div>
  );
};

// ============================================================
// Example 6: Using withLazy3D HOC
// ============================================================

// Original 3D component
const MyScene: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "20px",
      }}
    >
      Lazy Loaded Scene ({color})
    </div>
  );
};

// Wrap with HOC
const LazyScene = withLazy3D(MyScene, {
  threshold: 0.25,
  debounce: 400,
});

export const HOCExample: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <LazyScene color="purple" />
    </div>
  );
};

// ============================================================
// Example 7: Multiple Videos in Page
// ============================================================

export const MultipleVideosExample: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ height: "100vh" }}>
        <LazyHydratedVideo
          src="/media/hero/main.mp4"
          poster="/media/hero/main-poster.jpg"
          autoplay
          muted
          loop
        />
      </section>

      {/* Content */}
      <section style={{ height: "50vh", padding: "40px" }}>
        <h2>UV Transformation</h2>
        <p>Explore our UV-reactive fashion...</p>
      </section>

      {/* Product Demo */}
      <section style={{ height: "80vh" }}>
        <LazyHydratedVideo
          src="/media/products/demo.mp4"
          poster="/media/products/demo-poster.jpg"
          controls
          playsInline
          threshold={0.2}
        />
      </section>

      {/* More Content */}
      <section style={{ height: "50vh", padding: "40px" }}>
        <h2>Behind the Scenes</h2>
        <p>See how we create our pieces...</p>
      </section>

      {/* BTS Video */}
      <section style={{ height: "80vh" }}>
        <LazyHydratedVideo
          src="/media/bts/process.mp4"
          poster="/media/bts/process-poster.jpg"
          controls
          threshold={0.25}
        />
      </section>
    </div>
  );
};

// ============================================================
// Example 8: Custom Placeholder
// ============================================================

const CustomPlaceholder: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        gap: "20px",
      }}
    >
      <div style={{ fontSize: "48px" }}>🎬</div>
      <div style={{ fontSize: "18px", fontWeight: "bold" }}>HAORI VISION</div>
      <div style={{ fontSize: "14px", opacity: 0.8 }}>
        Loading UV Experience...
      </div>
    </div>
  );
};

export const CustomPlaceholderExample: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <LazyHydratedVideo
        src="/media/experience/intro.mp4"
        poster="/media/experience/poster.jpg"
        autoplay
        muted
        loop
        placeholder={<CustomPlaceholder />}
      />
    </div>
  );
};

// ============================================================
// Export All Examples
// ============================================================

export default {
  HeroVideoExample,
  ProductVideoExample,
  GalleryVideosExample,
  Scene3DExample,
  LazyImport3DExample,
  HOCExample,
  MultipleVideosExample,
  CustomPlaceholderExample,
};
