import { useRef, useEffect } from 'react';
import './Hero.css';

/*
  3 solid amber triangles — exactly as in the Figma close-up:
  Top-left ▶   Top-right ▶
               Bottom-right ▶   (stagger: top two side-by-side, third below-right)
*/
const GoldenTriangles = () => (
  <svg
    width="74"
    height="66"
    viewBox="0 0 74 66"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* top-left  */}
    <polygon points="0,2 30,16 0,30" fill="#D4A017" />
    {/* top-right */}
    <polygon points="40,0 70,14 40,28" fill="#D4A017" />
    {/* bottom — below the top-right */}
    <polygon points="40,36 70,50 40,64" fill="#D4A017" />
  </svg>
);

/*
  Two D-shaped semi-ovals matching the Figma design.
  Each "D" = flat-left, rounded-right, with a radial green gradient.
*/
const GreenDShapes = () => (
  <svg
    width="84"
    height="56"
    viewBox="0 0 84 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="dg-left" cx="60%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#4ECA80" />
        <stop offset="100%" stopColor="#196940" />
      </radialGradient>
      <radialGradient id="dg-right" cx="60%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#4ECA80" />
        <stop offset="100%" stopColor="#196940" />
      </radialGradient>
    </defs>
    {/* Left D */}
    <path
      d="M0 4 Q0 0 4 0 H12 Q40 0 40 28 Q40 56 12 56 H4 Q0 56 0 52 Z"
      fill="url(#dg-left)"
    />
    {/* Right D */}
    <path
      d="M44 4 Q44 0 48 0 H56 Q84 0 84 28 Q84 56 56 56 H48 Q44 56 44 52 Z"
      fill="url(#dg-right)"
    />
  </svg>
);

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

            {/* Man image — large card, top-left of visual */}
            <div className="hero-img-card hero-img-card--main">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F7f9843c544bc48dcab47a9e81ffd1d94?format=webp&width=600"
                alt="Seller managing their store"
                className="hero-img"
              />
            </div>

            {/* Woman image — smaller card, bottom-right, overlapping */}
            <div className="hero-img-card hero-img-card--secondary">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F3c3eced81ba243628af4fccb5d4cb186?format=webp&width=500"
                alt="Seller using inventory tools"
                className="hero-img"
              />
            </div>

            {/* Golden triangles — top-right gap between man card & edge */}
            <div className="hero-deco hero-deco--triangles">
              <GoldenTriangles />
            </div>

            {/* Green D-shapes — bottom, below man card / left of woman card */}
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
