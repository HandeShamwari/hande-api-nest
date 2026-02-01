import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(email);
      setTimeout(() => {
        setEmail('');
        setSubmitted('');
      }, 3000);
    }
  };

  return (
    <div className="app">
      <div className="floating-shapes">
        <div className="shape shape-1" style={{ transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)` }}></div>
        <div className="shape shape-2" style={{ transform: `translate(${mousePos.x * -0.01}px, ${mousePos.y * 0.03}px)` }}></div>
        <div className="shape shape-3" style={{ transform: `translate(${mousePos.x * 0.015}px, ${mousePos.y * -0.02}px)` }}></div>
      </div>

      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          <div className="logo">
            <img src="/logo.png" alt="Hande" className="logo-image" />
            <span className="logo-text">HANDE</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <button className="nav-cta" onClick={() => document.querySelector('.cta-section').scrollIntoView({ behavior: 'smooth' })}>Join Waitlist</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-grid-bg"></div>
        <div className="container hero-content">
          <div className="hero-text">
            <div className="badge-container">
              <span className="badge">COMING TO ZIMBABWE</span>
              <div className="badge-glow"></div>
            </div>
            
            <h1 className="hero-title">
              <span className="title-line animate-in" style={{ animationDelay: '0.1s' }}>YOUR</span>
              <span className="title-line title-accent animate-in" style={{ animationDelay: '0.2s' }}>RIDE</span>
              <span className="title-line animate-in" style={{ animationDelay: '0.3s' }}>YOUR WAY</span>
            </h1>
            
            <p className="hero-description animate-in" style={{ animationDelay: '0.4s' }}>
              Revolutionary ride-sharing built for Zimbabwe. Drivers pay just <span style={{ color: '#FFB800', fontWeight: 'bold' }}>$1/day</span> — no commission, no hidden fees. Fair rides for everyone.
            </p>
            
            <form className="email-form animate-in" style={{ animationDelay: '0.5s' }} onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  required
                />
                <div className="input-border"></div>
              </div>
              <button type="submit" className="cta-button">
                <span>{submitted ? '✓ GOT IT!' : 'EARLY ACCESS'}</span>
                <div className="button-shine"></div>
              </button>
            </form>
            
            <div className="hero-stats animate-in" style={{ animationDelay: '0.6s' }}>
              <div className="stat">
                <div className="stat-number" style={{ color: '#FFB800' }}>$1</div>
                <div className="stat-label">Per Day</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <div className="stat-number">0%</div>
                <div className="stat-label">Commission</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Service</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual animate-in" style={{ animationDelay: '0.3s' }}>
            <div className="phone-container">
              <div className="phone-glow"></div>
              <div className="phone-mockup">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="app-ui">
                    <div className="ui-header"></div>
                    <div className="map-visual">
                      <div className="map-grid"></div>
                      <div className="location-pin pulse"></div>
                      <div className="route-line"></div>
                    </div>
                    <div className="ride-card slide-up">
                      <div className="card-dot green"></div>
                      <div className="card-line"></div>
                      <div className="card-dot orange"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <div className="scroll-line"></div>
          <span>SCROLL</span>
        </div>
      </section>

      <section id="features" className="features">
        <div className="section-decoration"></div>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">WHY HANDE</span>
            <h2 className="section-title">Built Different</h2>
          </div>
          
          <div className="features-grid">
            {[
              { icon: '✓', title: 'Verified Drivers', desc: 'Every driver thoroughly vetted. Real-time tracking. Your safety first.' },
              { icon: '$', title: '$1/Day Subscription', desc: 'Drivers pay just $1/day. No commission. Keep 100% of your fares.' },
              { icon: '→', title: 'Lightning Fast', desc: 'Book in seconds. Driver arrives in minutes. No waiting around.' },
              { icon: '+', title: 'Shared Rides', desc: 'Split costs. Save money. Meet people. Better for everyone.' },
              { icon: '★', title: 'Rate & Review', desc: 'Your feedback matters. Help us maintain quality standards.' },
              { icon: '◆', title: 'Simple App', desc: 'Works on any phone. Low data usage. Designed for Zimbabwe.' },
            ].map((feature, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="icon-bg"></div>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
                <div className="card-corner"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container about-container">
          <div className="about-visual">
            <div className="visual-block block-1"></div>
            <div className="visual-block block-2">
              <div className="flag-icon">ZW</div>
            </div>
            <div className="visual-pattern"></div>
          </div>
          
          <div className="about-content">
            <span className="section-tag">ABOUT HANDE</span>
            <h2 className="section-title">Made in Zimbabwe, For Zimbabwe</h2>
            <p className="about-text">
              We're not just another ride-sharing app. Hande is built by Zimbabweans who understand the real challenges of getting around our cities. 
            </p>
            <p className="about-text">
              From Harare to Bulawayo, we're creating opportunities for drivers and making transportation accessible for everyone. This is mobility done right.
            </p>
            
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-check">✓</div>
                <span>Drivers keep 100% of fares — just <span style={{ color: '#FFB800' }}>$1/day</span> subscription</span>
              </div>
              <div className="about-feature">
                <div className="feature-check">✓</div>
                <span>Built for Zimbabwean roads & conditions</span>
              </div>
              <div className="about-feature">
                <div className="feature-check">✓</div>
                <span>Community-focused, safety-first</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-bg-pattern"></div>
        <div className="container cta-content">
          <h2 className="cta-title">Be First. Be Ready.</h2>
          <p className="cta-description">
            Join thousands on our waitlist. Get exclusive early access when we launch.
          </p>
          <form className="email-form cta-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input cta-input"
              required
            />
            <button type="submit" className="cta-button cta-button-alt">
              <span>{submitted ? 'WELCOME!' : 'JOIN NOW'}</span>
            </button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/logo.png" alt="Hande" />
                <span>HANDE</span>
              </div>
              <p>Your ride, your way.<br />Coming soon to Zimbabwe.</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-col">
                <h4>Contact</h4>
                <a href="mailto:info@handeapp.co.zw">info@handeapp.co.zw</a>
                <a href="mailto:support@handeapp.co.zw">support@handeapp.co.zw</a>
              </div>
              
              <div className="footer-col">
                <h4>Follow</h4>
                <a href="#">Facebook</a>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© 2026 Hande. All rights reserved.</p>
            <div className="footer-badge">MADE IN ZIMBABWE</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
