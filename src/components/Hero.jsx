import { useState, useRef, useEffect } from 'react';
import './Hero.css';

const HeroArrow = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeroQuoteIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 21C7 13.27 13.27 7 21 7V3C10.98 3 3 10.98 3 21V37H21V25H7V21Z" fill="#C4A66D" opacity="0.3"/>
    <path d="M23 21C23 13.27 29.27 7 37 7V3C26.98 3 19 10.98 19 21V37H37V25H23V21Z" fill="#C4A66D" opacity="0.3"/>
  </svg>
);

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imagesRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setMousePos({ x, y });

      if (imagesRef.current) {
        const moveX = (x - 0.5) * 20;
        const moveY = (y - 0.5) * 20;
        imagesRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero-section" ref={containerRef}>
      <div className="hero-container">
        {/* Left Content */}
        <div className="hero-content">
          <h1 className="hero-title">Launch your online store in a minute for free</h1>
          <p className="hero-description">
            Varanda Business gives you a free storefront, secure payments, inventory tools, and logistics support. Everything you need to run your business online from one simple platform.
          </p>

          <div className="hero-cta-group">
            <button className="hero-btn-primary">
              <span>Start My Free Store</span>
            </button>
            <button className="hero-btn-secondary">
              <span>See Example Store</span>
            </button>
          </div>
        </div>

        {/* Right Images & Decoratives */}
        <div className="hero-visual">
          <div className="hero-images-wrapper" ref={imagesRef}>
            {/* Top Left Image */}
            <div className="hero-image-card hero-image-card--left">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
                alt="Store owner"
                className="hero-image"
              />
            </div>

            {/* Bottom Right Image */}
            <div className="hero-image-card hero-image-card--right">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"
                alt="Customer experience"
                className="hero-image"
              />
            </div>
          </div>

          {/* Floating Arrow */}
          <div className="hero-accent-arrow">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(24, 24)">
                <circle cx="0" cy="0" r="20" fill="#D4AF37" opacity="0.15"/>
                <path d="M0,-12 L8,-4 L0,4" stroke="#D4AF37" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M0,-12 L-8,-4 L0,4" stroke="#D4AF37" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
          </div>

          {/* Quote Mark Accent */}
          <div className="hero-accent-quote">
            <HeroQuoteIcon />
          </div>
        </div>
      </div>

      {/* Decorative Gradient Background */}
      <div className="hero-gradient-bg" />
    </section>
  );
};

export default Hero;
