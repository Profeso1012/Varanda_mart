import Header from './components/Header';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import './App.css';

function App() {
  return (
    <>
      <Header />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <main className="app-main">
        {/* Additional sections will be added here */}
      </main>
    </>
  );
}

export default App;
