"use client";

import React, { useEffect, useRef } from "react";

interface ParticleWaveProps {
  className?: string;
  particleColor?: string;
  lineColor?: string;
  density?: number;
}

export const ParticleWave: React.FC<ParticleWaveProps> = ({
  className = "",
  particleColor = "rgba(230, 230, 226, 0.65)",
  lineColor = "rgba(183, 227, 106, 0.12)",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Grid config based on resolution
    const isMobile = window.innerWidth < 768;
    const cols = isMobile ? 32 : 54;
    const rows = isMobile ? 20 : 32;

    const spacingX = 40;
    const spacingY = 32;

    const gridWidth = (cols - 1) * spacingX;
    const gridHeight = (rows - 1) * spacingY;

    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      targetMouseX = x * 0.0005;
      targetMouseY = y * 0.0005;
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      time += prefersReducedMotion ? 0.002 : 0.015;

      const focalLength = 400;
      const cameraZ = -180;
      const cameraY = 160 + mouseY * 100;
      const rotX = 0.55 + mouseY * 0.2;
      const rotY = mouseX * 0.3;

      const cosRX = Math.cos(rotX);
      const sinRX = Math.sin(rotX);
      const cosRY = Math.cos(rotY);
      const sinRY = Math.sin(rotY);

      const points: { x2d: number; y2d: number; z3d: number; scale: number; alpha: number }[][] = [];

      // Calculate 3D points
      for (let r = 0; r < rows; r++) {
        points[r] = [];
        for (let c = 0; c < cols; c++) {
          const origX = c * spacingX - gridWidth / 2;
          const origZ = r * spacingY - gridHeight / 2;

          // Multi-frequency wave calculation for natural organic motion
          const distFromCenter = Math.sqrt(origX * origX + origZ * origZ) * 0.003;
          const wave1 = Math.sin(origX * 0.015 + time * 1.2 + distFromCenter);
          const wave2 = Math.cos(origZ * 0.018 + time * 0.9);
          const wave3 = Math.sin((origX + origZ) * 0.01 + time * 1.5) * 8;

          const origY = (wave1 * 18 + wave2 * 22 + wave3) * (1 + distFromCenter * 0.5);

          // Rotate Y
          const x1 = origX * cosRY + origZ * sinRY;
          const z1 = -origX * sinRY + origZ * cosRY;

          // Rotate X & Shift Camera
          const y2 = origY * cosRX - z1 * sinRX + cameraY;
          const z2 = origY * sinRX + z1 * cosRX - cameraZ;

          // Perspective projection
          const scale = focalLength / (focalLength + z2);
          const x2d = width / 2 + x1 * scale;
          const y2d = height / 2 + y2 * scale;

          const alpha = Math.max(0.05, Math.min(0.85, (scale - 0.4) * 1.4));

          points[r][c] = { x2d, y2d, z3d: z2, scale, alpha };
        }
      }

      // Draw faint connecting lines between points
      ctx.lineWidth = 0.75;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = points[r][c];

          if (pt.scale <= 0) continue;

          // Connect to right neighbor
          if (c < cols - 1) {
            const rightPt = points[r][c + 1];
            if (rightPt.scale > 0) {
              ctx.strokeStyle = lineColor;
              ctx.beginPath();
              ctx.moveTo(pt.x2d, pt.y2d);
              ctx.lineTo(rightPt.x2d, rightPt.y2d);
              ctx.stroke();
            }
          }

          // Connect to bottom neighbor
          if (r < rows - 1) {
            const bottomPt = points[r + 1][c];
            if (bottomPt.scale > 0) {
              ctx.strokeStyle = lineColor;
              ctx.beginPath();
              ctx.moveTo(pt.x2d, pt.y2d);
              ctx.lineTo(bottomPt.x2d, bottomPt.y2d);
              ctx.stroke();
            }
          }

          // Draw Particle Node
          const radius = Math.max(0.6, 1.8 * pt.scale);
          ctx.fillStyle = particleColor;
          ctx.beginPath();
          ctx.arc(pt.x2d, pt.y2d, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [particleColor, lineColor]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle radial fade gradient on top to blend into dark layout */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#050505]/40 to-[#050505] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
    </div>
  );
};
