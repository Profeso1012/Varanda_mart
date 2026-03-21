import { useRef, useEffect } from 'react';
import bgImage from '../assets/frame-219.png';
import HeroImageGroup from './HeroImageGroup';
import './Hero.css';

const Hero = () => {
  const sectionRef = useRef(null);
  const imagesRef = useRef(null);

  /* Subtle parallax on mouse-move */
  useEffect(() => {
    const section = sectionRef.current;
    const handleMove = (e) => {
      if (!imagesRef.current) return;
      const r = section.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      imagesRef.current.style.transform = `translate(${x * 14}px, ${y * 10}px)`;
    };
    const handleLeave = () => {
      if (imagesRef.current) imagesRef.current.style.transform = 'translate(0,0)';
    };
    section.addEventListener('mousemove', handleMove);
    section.addEventListener('mouseleave', handleLeave);
    return () => {
      section.removeEventListener('mousemove', handleMove);
      section.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <section
      className="hero-section"
      ref={sectionRef}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
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
        <div className="hero-visual" ref={imagesRef}>
          <HeroImageGroup />
        </div>

      </div>
    </section>
  );
};

export default Hero;
