import Header from './components/Header';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import './App.css';

function App() {
  return (
    <>
      <Header />
      <Hero />
      <TrustStrip />
      <main className="app-main">
        {/* Additional sections will be added here */}
      </main>
    </>
  );
}

export default App;
