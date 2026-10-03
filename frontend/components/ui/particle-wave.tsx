"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ParticleWaveProps {
  className?: string;
  particleColor?: string; // Optional custom base or accent color override
}

export const ParticleWave: React.FC<ParticleWaveProps> = ({
  className = "",
  particleColor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Responsive particle count setup
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    const SEPARATION = isMobile ? 75 : 62;
    const AMOUNTX = isMobile ? 38 : isTablet ? 58 : 78;
    const AMOUNTY = isMobile ? 26 : isTablet ? 42 : 52;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let particles: THREE.Points;
    let count = 0;

    let mouseX = 0;
    let mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    let animationFrameId: number;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function init() {
      if (!container) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      windowHalfX = width / 2;
      windowHalfY = height / 2;

      camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
      camera.position.z = 980;
      camera.position.y = 360;

      scene = new THREE.Scene();

      const numParticles = AMOUNTX * AMOUNTY;
      const positions = new Float32Array(numParticles * 3);
      const scales = new Float32Array(numParticles);

      let i = 0, j = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
          positions[i + 1] = 0;
          positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

          scales[j] = 1;

          i += 3;
          j++;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

      // Dark Mode: soft near-white (#D4D4D0) base + bright lime (#B7E36A)
      const baseColor = new THREE.Color("#D4D4D0");
      const accentColor = new THREE.Color(particleColor || "#B7E36A");

      const material = new THREE.ShaderMaterial({
        uniforms: {
          baseColor: { value: baseColor },
          accentColor: { value: accentColor },
        },
        vertexShader: `
          attribute float scale;
          varying float vElevation;
          void main() {
            vElevation = position.y;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = scale * ( 320.0 / -mvPosition.z );
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 baseColor;
          uniform vec3 accentColor;
          varying float vElevation;
          void main() {
            float dist = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
            if ( dist > 0.48 ) discard;
            
            float edgeAlpha = smoothstep( 0.48, 0.22, dist );
            
            // Restrained lime influence only on wave crests (> 20px elevation)
            float limeInfluence = smoothstep( 20.0, 90.0, vElevation ) * 0.75;
            vec3 finalColor = mix( baseColor, accentColor, limeInfluence );
            
            float alpha = (0.72 + limeInfluence * 0.18) * edgeAlpha;
            gl_FragColor = vec4( finalColor, alpha );
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      container.appendChild(renderer.domElement);

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", onWindowResize, false);
    }

    function onWindowResize() {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      windowHalfX = width / 2;
      windowHalfY = height / 2;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.isPrimary === false) return;
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      render();
    }

    function render() {
      if (!camera || !scene || !renderer || !particles) return;

      camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.3 + 360 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      const positions = particles.geometry.attributes.position.array as Float32Array;
      const scales = particles.geometry.attributes.scale.array as Float32Array;

      let i = 0, j = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const waveX = Math.sin((ix + count) * 0.22) * 60;
          const waveY = Math.sin((iy + count) * 0.32) * 55;
          const waveDiag = Math.cos((ix + iy + count) * 0.14) * 28;

          positions[i + 1] = waveX + waveY + waveDiag;

          scales[j] =
            (Math.sin((ix + count) * 0.22) + 1) * 2.6 +
            (Math.sin((iy + count) * 0.32) + 1) * 2.6 +
            1.1;

          i += 3;
          j++;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.scale.needsUpdate = true;

      renderer.render(scene, camera);

      count += prefersReducedMotion ? 0.005 : 0.024;
    }

    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onWindowResize);

      if (particles) {
        particles.geometry.dispose();
        (particles.material as THREE.Material).dispose();
      }

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      }
    };
  }, [particleColor]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    />
  );
};
