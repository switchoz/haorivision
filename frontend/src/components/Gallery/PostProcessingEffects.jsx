import { useRef, useEffect } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import * as THREE from "three";

// Регистрируем в Three.js
extend({ EffectComposer, RenderPass, UnrealBloomPass, ShaderPass });

/**
 * ✨ POST-PROCESSING EFFECTS
 *
 * Bloom, Vignette, Color Grading для сценического вида
 */

export default function PostProcessingEffects({
  bloomStrength = 1.5,
  bloomRadius = 0.4,
  bloomThreshold = 0.85,
  vignetteIntensity = 0.3,
  enabled = true,
}) {
  const composerRef = useRef();
  const { gl, scene, camera, size } = useThree();

  // Создаём composer
  useEffect(() => {
    if (!enabled) return;

    // Composer
    const composer = new EffectComposer(gl);
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Render Pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom Pass
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      bloomStrength,
      bloomRadius,
      bloomThreshold,
    );
    composer.addPass(bloomPass);

    // FXAA (Anti-aliasing)
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms["resolution"].value.x =
      1 / (size.width * Math.min(window.devicePixelRatio, 2));
    fxaaPass.material.uniforms["resolution"].value.y =
      1 / (size.height * Math.min(window.devicePixelRatio, 2));
    composer.addPass(fxaaPass);

    // Vignette Pass (custom shader)
    const vignettePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        intensity: { value: vignetteIntensity },
        color: { value: new THREE.Color("#000000") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        uniform vec3 color;
        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 uv = vUv * 2.0 - 1.0;
          float dist = length(uv);
          float vignette = smoothstep(1.0, 0.3, dist);
          vignette = mix(1.0, vignette, intensity);

          gl_FragColor = vec4(mix(color, texel.rgb, vignette), texel.a);
        }
      `,
    });
    composer.addPass(vignettePass);

    composerRef.current = composer;

    // Обновление размера
    const handleResize = () => {
      composer.setSize(size.width, size.height);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      fxaaPass.material.uniforms["resolution"].value.x =
        1 / (size.width * Math.min(window.devicePixelRatio, 2));
      fxaaPass.material.uniforms["resolution"].value.y =
        1 / (size.height * Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      composer.dispose();
    };
  }, [
    gl,
    scene,
    camera,
    size,
    enabled,
    bloomStrength,
    bloomRadius,
    bloomThreshold,
    vignetteIntensity,
  ]);

  // Рендер через composer
  useFrame(() => {
    if (composerRef.current && enabled) {
      composerRef.current.render();
    }
  }, 1);

  return null;
}

// Breathing Bloom (дышащий bloom для UV-эффекта)
export function BreathingBloom({
  minStrength = 1.0,
  maxStrength = 2.5,
  breathSpeed = 2.0,
  ...props
}) {
  const [bloomStrength, setBloomStrength] = [minStrength];

  useFrame(({ clock }) => {
    const breath = Math.sin(clock.elapsedTime * breathSpeed) * 0.5 + 0.5;
    const newStrength = minStrength + (maxStrength - minStrength) * breath;

    if (Math.abs(newStrength - bloomStrength) > 0.01) {
      setBloomStrength(newStrength);
    }
  });

  return <PostProcessingEffects bloomStrength={bloomStrength} {...props} />;
}

// Scene-Based Effects (эффекты на основе сцены таймлайна)
export function SceneBasedEffects({ scene }) {
  const bloomStrength = scene?.effects?.bloom || 1.5;
  const vignetteIntensity = scene?.effects?.vignette || 0.3;

  return (
    <PostProcessingEffects
      bloomStrength={bloomStrength}
      vignetteIntensity={vignetteIntensity}
      bloomRadius={0.4}
      bloomThreshold={0.85}
      enabled={true}
    />
  );
}
