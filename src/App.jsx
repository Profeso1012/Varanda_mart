import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import WhoItsFor from './components/WhoItsFor';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <WhoItsFor />
      <CtaBanner />
      <Footer />
      <main className="app-main">
        {/* Additional sections will be added here */}
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

export default App;
