import Header from '../components/Header';
import Hero from '../components/Hero';
import TrustStrip from '../components/TrustStrip';
import Features from '../components/Features';
import WhoItsFor from '../components/WhoItsFor';
import HowItWorks from '../components/HowItWorks';
import CtaBanner from '../components/CtaBanner';
import Footer from '../components/Footer';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <Hero />
      <TrustStrip />
      <Features />
      <WhoItsFor />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </div>
  );
}
