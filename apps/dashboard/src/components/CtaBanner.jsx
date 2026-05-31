import { useNavigate } from 'react-router-dom';
import './CtaBanner.css';

const CtaBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-card">
        <div className="cta-card__content">
          <h2 className="cta-card__title">Ready to launch your online store?</h2>
          <p className="cta-card__subtitle">
            Create your free storefront today and start selling across Africa
          </p>
          <button className="cta-card__btn" onClick={() => navigate('/register')}>Create My Free Store</button>
        </div>
        <span className="cta-card__watermark">VARANDA</span>
      </div>
    </section>
  );
};

export default CtaBanner;
