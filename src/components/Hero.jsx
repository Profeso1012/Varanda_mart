import { useRef, useEffect } from 'react';
import './Hero.css';

/* Golden triangles — 3 right-pointing shapes matching the Figma design */
const GoldenTriangles = () => (
  <svg width="74" height="64" viewBox="0 0 74 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="0,0 34,16 0,32" fill="#D4A017"/>
    <polygon points="40,0 74,16 40,32" fill="#D4A017"/>
    <polygon points="20,34 54,50 20,64" fill="#D4A017"/>
  </svg>
);

/* Green D-shapes — the double quotation-like green forms in the Figma design */
const GreenDShapes = () => (
  <svg width="80" height="54" viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0 0 H10 Q36 0 36 27 Q36 54 10 54 H0 Z" fill="#22925B"/>
    <path d="M44 0 H54 Q80 0 80 27 Q80 54 54 54 H44 Z" fill="#22925B"/>
  </svg>
);

const Hero = () => {
  const sectionRef = useRef(null);
  const imagesRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!sectionRef.current || !imagesRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      imagesRef.current.style.transform = `translate(${x * 16}px, ${y * 12}px)`;
    };

    const section = sectionRef.current;
    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', () => {
      if (imagesRef.current) imagesRef.current.style.transform = 'translate(0,0)';
    });
    return () => {
      section.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className="hero-section" ref={sectionRef}>
      {/* Left-side green radial glow */}
      <div className="hero-blob" aria-hidden="true" />

      <div className="hero-container">

        {/* ── Left: Text Content ───────────────────────── */}
        <div className="hero-content">
          <h1 className="hero-title">
            Launch your online store in a minute for free
          </h1>
          <p className="hero-description">
            Varanda Business gives you a free storefront, secure payments,
            inventory tools, and logistics support, everything you need to
            run your business online from one simple platform.
          </p>
          <div className="hero-cta-row">
            <button className="hero-btn-primary">Start My Free Store</button>
            <button className="hero-btn-secondary">See Example Store</button>
          </div>
        </div>

        {/* ── Right: Images + Decoratives ─────────────── */}
        <div className="hero-visual">
          <div className="hero-images" ref={imagesRef}>

            {/* Main image — man in store */}
            <div className="hero-img-card hero-img-card--main">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F7f9843c544bc48dcab47a9e81ffd1d94?format=webp&width=600"
                alt="Seller managing their store"
                className="hero-img"
              />
            </div>

            {/* Secondary image — woman with tablet */}
            <div className="hero-img-card hero-img-card--secondary">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F3c3eced81ba243628af4fccb5d4cb186?format=webp&width=500"
                alt="Seller using inventory tools"
                className="hero-img"
              />
            </div>

            {/* Decorative: golden triangles — top-right */}
            <div className="hero-deco hero-deco--triangles">
              <GoldenTriangles />
            </div>

            {/* Decorative: green D-shapes — bottom-center */}
            <div className="hero-deco hero-deco--dshapes">
              <GreenDShapes />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
