import { useCallback, useEffect, useRef } from "react";

/**
 * NeuralCanvas - Interactive neural network particle animation
 * Ported from ai-agency-website with React integration
 * Features:
 * - Floating particle nodes with gentle animation
 * - Connected network lines between nearby particles
 * - Mouse interaction with electric lightning effects
 * - Responsive canvas sizing
 */
const NeuralCanvas = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Configuration
  const config = {
    particleCount: 100,
    connectionDistance: 180,
    mouseDistance: 300,
    electricDistance: 200,
    colors: {
      primary: "#2b7de9", // Ocean blue
      secondary: "#5ec5b0", // Seafoam
      accent: "#2b7de9", // Ocean blue accent
    },
  };

  // Particle class
  class Particle {
    constructor(width, height) {
      this.baseX = Math.random() * width;
      this.baseY = Math.random() * height;
      this.x = this.baseX;
      this.y = this.baseY;
      this.floatOffset = Math.random() * Math.PI * 2;
      this.floatSpeed = 0.0008 + Math.random() * 0.0008;
      this.floatRadius = 2 + Math.random() * 4;
      this.size = Math.random() * 2 + 1.5;
      this.color =
        Math.random() > 0.5 ? config.colors.primary : config.colors.secondary;
      this.baseAlpha = 0.4 + Math.random() * 0.25;
      this.alpha = this.baseAlpha;
      this.isElectric = false;
    }

    update(mouse, mouseDistance, electricDistance) {
      this.floatOffset += this.floatSpeed;
      this.x = this.baseX + Math.sin(this.floatOffset) * this.floatRadius;
      this.y = this.baseY + Math.cos(this.floatOffset * 0.7) * this.floatRadius;
      this.isElectric = false;

      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseDistance) {
          const proximity = 1 - distance / mouseDistance;
          this.alpha = this.baseAlpha + proximity * 0.3;
          this.size = Math.random() * 2 + 1.5 + proximity * 2.5;

          if (distance < electricDistance) {
            this.isElectric = true;
          }
        } else {
          this.alpha = this.baseAlpha;
          this.size = Math.random() * 2 + 1.5;
        }
      }
    }

    draw(ctx) {
      if (this.isElectric) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
      } else {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();

      // Extra bright core for electric nodes
      if (this.isElectric) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    }
  }

  const initParticles = useCallback((width, height) => {
    particlesRef.current = [];
    for (let i = 0; i < config.particleCount; i++) {
      particlesRef.current.push(new Particle(width, height));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawElectricConnections = useCallback((ctx, mouse, particles) => {
    if (mouse.x === null) return;

    const electricNodes = particles
      .filter((p) => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < config.electricDistance;
      })
      .sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(mouse.x - a.x, 2) + Math.pow(mouse.y - a.y, 2),
        );
        const distB = Math.sqrt(
          Math.pow(mouse.x - b.x, 2) + Math.pow(mouse.y - b.y, 2),
        );
        return distA - distB;
      })
      .slice(0, 4);

    electricNodes.forEach((node) => {
      const dx = mouse.x - node.x;
      const dy = mouse.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const proximity = 1 - distance / config.electricDistance;

      // Draw lightning with multiple layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);

        // Lightning segments with randomness
        const segments = 4;
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const x =
            mouse.x +
            (node.x - mouse.x) * t +
            (Math.random() - 0.5) * 12 * (1 - t);
          const y =
            mouse.y +
            (node.y - mouse.y) * t +
            (Math.random() - 0.5) * 12 * (1 - t);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(node.x, node.y);

        if (layer === 0) {
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 3.5 * proximity;
          ctx.globalAlpha = 0.12 * proximity;
          ctx.shadowBlur = 18;
          ctx.shadowColor = node.color;
        } else if (layer === 1) {
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.8 * proximity;
          ctx.globalAlpha = 0.45 * proximity;
          ctx.shadowBlur = 8;
          ctx.shadowColor = node.color;
        } else {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.6 * proximity;
          ctx.globalAlpha = 0.7 * proximity;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#ffffff";
        }

        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawConnections = useCallback((ctx, particles, mouse) => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.connectionDistance) {
          let opacity = 1 - distance / config.connectionDistance;
          let isElectricConnection = false;

          if (mouse.x !== null) {
            const distToMouse1 = Math.sqrt(
              Math.pow(mouse.x - particles[i].x, 2) +
              Math.pow(mouse.y - particles[i].y, 2),
            );
            const distToMouse2 = Math.sqrt(
              Math.pow(mouse.x - particles[j].x, 2) +
              Math.pow(mouse.y - particles[j].y, 2),
            );

            const minDistToMouse = Math.min(distToMouse1, distToMouse2);
            if (minDistToMouse < config.mouseDistance) {
              const mouseProximity = 1 - minDistToMouse / config.mouseDistance;
              opacity = Math.min(1, opacity + mouseProximity * 0.5);

              if (minDistToMouse < config.electricDistance) {
                isElectricConnection = true;
              }
            }
          }

          ctx.beginPath();

          if (isElectricConnection) {
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 1.2 + opacity * 1.2;
            ctx.globalAlpha = opacity * 0.7;
            ctx.shadowBlur = 8;
            ctx.shadowColor = particles[i].color;
          } else {
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 0.4 + opacity * 0.4;
            ctx.globalAlpha = opacity * 0.35;
          }

          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = dimensionsRef.current;
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    ctx.clearRect(0, 0, width, height);

    // Draw electric lightning from mouse
    drawElectricConnections(ctx, mouse, particles);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(mouse, config.mouseDistance, config.electricDistance);
      particles[i].draw(ctx);
    }

    // Draw connections between particles
    drawConnections(ctx, particles, mouse);

    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawElectricConnections, drawConnections]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      dimensionsRef.current = { width: rect.width, height: rect.height };
      initParticles(rect.width, rect.height);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    // Initial setup
    handleResize();

    // Start animation
    animate();

    // Event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`neural-canvas ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 0,
      }}
    />
  );
};

export default NeuralCanvas;
