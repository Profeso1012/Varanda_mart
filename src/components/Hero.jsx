import { useRef, useEffect } from 'react';
import triangle from '../assets/polygon-4.png';
import ellipse from '../assets/ellipse-12.png';
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
    <section className="hero-section" ref={sectionRef}>

      {/* ── Background glow image (Frame 219.png) ──────── */}
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F5e32cf1bd31f42c4a7968576a1ce9f33?format=webp&width=1000"
        alt=""
        className="hero-bg-image"
        aria-hidden="true"
      />

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


            {/* Triangles cluster — top-right gap between man card & edge */}
            <div className="hero-deco hero-deco--triangles">
              <img src={triangle} alt="" className="hero-triangle" />
              <img src={triangle} alt="" className="hero-triangle" />
              <img src={triangle} alt="" className="hero-triangle" />
              <img src={triangle} alt="" className="hero-triangle" />
            </div>

            {/* Ellipses — bottom, below man card / left of woman card */}
            <div className="hero-deco hero-deco--ellipses">
              <img src={ellipse} alt="" className="hero-ellipse" />
              <img src={ellipse} alt="" className="hero-ellipse" />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
