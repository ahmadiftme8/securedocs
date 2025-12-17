<script setup lang="ts">
import { ref, onMounted } from 'vue'

// State
const isMobileMenuOpen = ref(false)
const isHoveringFile = ref(false)

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
}

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
      }
    })
  }, observerOptions)

  document.querySelectorAll('.fade-in-section').forEach((el) => {
    observer.observe(el)
  })
})

function toggleMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <div class="landing-page">
    <!-- Sticky Navbar -->
    <nav class="navbar">
      <div class="nav-brand">
        <span class="brand-text">Fylor</span>
      </div>
      <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle Menu">
        <span class="hamburger">☰</span>
      </button>

      <!-- Mobile Menu Overlay -->
      <div class="mobile-menu" :class="{ 'is-open': isMobileMenuOpen }">
        <router-link to="/login" class="nav-link" @click="toggleMenu">Login</router-link>
        <router-link to="/register" class="nav-link btn-nav" @click="toggleMenu">Sign Up</router-link>
      </div>

      <!-- Desktop Links (hidden on mobile) -->
      <div class="desktop-links">
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link btn-nav">Sign Up</router-link>
      </div>
    </nav>

    <!-- 1. The "Split-Screen" Hero Section -->
    <section class="hero-section">
      <div class="hero-content fade-in-section">
        <h1 class="headline">Files that <span class="highlight">think.</span></h1>
        <h2 class="sub-headline">
          Stop digging through folders. Upload documents and let AI summarize, organize, and secure them instantly.
        </h2>
        <div class="cta-group">
          <router-link to="/register" class="btn btn-primary">Try the Demo</router-link>
          <a href="https://github.com/ahmadiftme8/securedocs" target="_blank" class="btn btn-secondary">View on GitHub</a>
        </div>
      </div>

      <div class="hero-visual fade-in-section" @mouseenter="isHoveringFile = true" @mouseleave="isHoveringFile = false">
        <div class="mockup-container" :class="{ 'transform-active': isHoveringFile }">
          <img src="/dashboard-mockup.png" alt="Fylor Dashboard" class="dashboard-mockup" />
        </div>
      </div>
    </section>

    <!-- 2. The "Tech-Trust" Ticker -->
    <section class="ticker-section">
      <div class="ticker-content">
        <span class="ticker-item">End-to-End Encryption</span>
        <span class="separator">•</span>
        <span class="ticker-item">Serverless Architecture</span>
        <span class="separator">•</span>
        <span class="ticker-item">Netlify CDN</span>
        <span class="separator">•</span>
        <span class="ticker-item">Vue 3 Powered</span>
        <span class="ticker-item">End-to-End Encryption</span>
        <span class="separator">•</span>
        <span class="ticker-item">Serverless Architecture</span>
        <span class="separator">•</span>
        <span class="ticker-item">Netlify CDN</span>
        <span class="separator">•</span>
        <span class="ticker-item">Vue 3 Powered</span>
      </div>
    </section>

    <!-- 3. The "Bento Grid" Feature Showcase -->
    <section class="features-section fade-in-section">
      <div class="bento-grid">
        <!-- Row 1: Large (2), Medium (1), Tall (1, row 2) -->

        <!-- Card 1 (Large - The Hero Feature) -->
        <div class="bento-card large">
          <div class="card-content">
            <h3>AI Semantic Search</h3>
            <p>Search by meaning, not just filenames. Find exact concepts hidden deep within your docs.</p>
          </div>
          <div class="card-visual search-visual"></div>
        </div>

        <!-- Card 3 (Medium - The UX Feature) -->
        <div class="bento-card medium">
          <div class="card-content">
            <h3>Drag, Drop, Done</h3>
            <p>Real-time upload with visual progress tracking.</p>
          </div>
          <div class="card-visual upload-visual"></div>
        </div>

        <!-- Card 2 (Tall - The Security Feature) -->
        <div class="bento-card tall">
           <div class="card-content">
            <h3>Role-Based Access</h3>
            <p>Granular control with JWT Auth. You decide who sees what.</p>
          </div>
          <div class="card-visual security-visual">
            <div class="shield-icon">🛡️</div>
          </div>
        </div>

        <!-- Row 2: Small/Offline (3) -->

        <!-- Card 4 (Offline Ready - Filling the gap) -->
        <div class="bento-card small offline-badge">
          <div class="badge-content">
            <h3>Offline Ready</h3>
            <p>PWA & Pinia Persistence.</p>
          </div>
          <div class="offline-icon">☁️</div>
        </div>
      </div>
    </section>

    <!-- 4. The "Zig-Zag" Deep Dive -->
    <section class="zigzag-section">
      <div class="zigzag-item fade-in-section">
        <div class="text-box">
          <h3>Summaries in Seconds</h3>
          <p>Drowning in meeting notes? Fylor's AI reads for you, extracting key points and action items instantly.</p>
        </div>
        <div class="visual-box summary-visual-box">
          <img src="/summary-feature.png" alt="AI Summaries" class="feature-image" />
        </div>
      </div>

      <div class="zigzag-item reverse fade-in-section">
        <div class="text-box">
          <h3>Fortress-Level Privacy</h3>
          <p>Your data stays yours. Stateless JWT authentication ensures that your session is secure and private.</p>
        </div>
        <div class="visual-box privacy-visual-box">
          <img src="/privacy-shield.png" alt="Privacy Shield" class="feature-image" />
        </div>
      </div>
    </section>

    <!-- 5. The "Developer Experience" Callout -->
    <section class="dev-xp-section fade-in-section">
      <div class="code-block-container">
        <div class="code-header">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="filename">deployment.yaml</span>
        </div>
        <pre>
<span class="keyword">pipeline</span>:
  <span class="property">build</span>:
    <span class="string">serverless</span>: true
    <span class="string">ci-cd</span>: automated
    <span class="string">security</span>: max
</pre>
        <p class="dev-caption">Built for robustness. Scalable from day one.</p>
      </div>
    </section>

    <!-- 6. The Final CTA -->
    <section class="final-cta fade-in-section">
      <h2>Your documents deserve an upgrade.</h2>
      <router-link to="/register" class="btn btn-primary pulse-btn">Get Started Now</router-link>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="brand-text-sm">Fylor</span>
          <p class="copyright">© 2025 Fylor. All rights reserved.</p>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Service</a>
          <a href="https://github.com/ahmadiftme8/securedocs" class="footer-link">GitHub</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Jersey+10&family=Poppins:wght@300;400;500;600;700&family=Kalam:wght@300;400;700&display=swap');

/* Base Layout & Fonts */
.landing-page {
  font-family: 'Poppins', sans-serif;
  color: #5B787C; /* Myrtle Green */
  background-color: #F4E6CF; /* Champagne */
  min-height: 100vh;
  overflow-x: hidden;
  padding-top: 60px; /* Space for fixed navbar */
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: rgba(244, 230, 207, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  z-index: 1000;
  border-bottom: 2px solid rgba(91, 120, 124, 0.1);
}

.nav-brand .brand-text {
  font-family: 'Jersey 10', cursive;
  font-size: 2.5rem;
  color: #A22B25;
}

.menu-toggle {
  display: none; /* Hidden on desktop */
  background: none;
  border: none;
  font-size: 2rem;
  color: #5B787C;
  cursor: pointer;
}

.desktop-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #5B787C;
  font-weight: 600;
  font-size: 1rem;
}

.btn-nav {
  background: #A22B25;
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
  transition: transform 0.2s;
}

.btn-nav:hover {
  transform: translateY(-2px);
}

.mobile-menu {
  display: none;
}

section {
  padding: 3rem 2rem; /* REDUCED PADDING */
  max-width: 1400px; /* Increased max width for more space on big screens */
  margin: 0 auto;
}

.fade-in-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 1. Hero Section */
.hero-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  min-height: 85vh;
}

.hero-content {
  flex: 1; /* Was 3. Now roughly 50% */
}

.hero-visual {
  flex: 1; /* Was 2. Now equal width */
  display: flex;
  justify-content: flex-end; /* Push to right */
  align-items: center;
  height: auto;
  min-height: 400px;
  position: relative;
  perspective: 1000px;
}

.headline {
  font-family: 'Jersey 10', cursive;
  font-size: 6rem; /* Huge mobile default? No, responsive below */
  font-weight: 400;
  line-height: 0.9;
  margin-bottom: 1.5rem;
  color: #A22B25;
}

.highlight {
  position: relative;
  display: inline-block;
  color: #5B787C;
}

.highlight::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0.2em;
  background: #A22B25;
  opacity: 0.2;
  z-index: -1;
}

.sub-headline {
  font-size: 1.5rem; /* Increased size */
  color: #5B787C;
  margin-bottom: 2.5rem;
  max-width: 90%;
  line-height: 1.4;
  font-weight: 400;
}

.cta-group {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn {
  padding: 1.2rem 3rem; /* Larger buttons */
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Poppins', sans-serif;
  letter-spacing: 0.5px;
  white-space: nowrap;
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #A22B25 0% , #801f1a 100%);
  color: white;
  border: none;
  box-shadow: 0 8px 20px rgba(162, 43, 37, 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(162, 43, 37, 0.4);
  background: linear-gradient(135deg, #801f1a 0%, #A22B25 100%);
}

.btn-secondary {
  background: transparent;
  color: #5B787C;
  border: 2px solid #5B787C;
}

.btn-secondary:hover {
  background: rgba(91, 120, 124, 0.1);
  transform: translateY(-3px);
}

/* Upgraded Hero Visual & Animation */
.mockup-container {
  width: 100%;
  max-width: 800px; /* Much larger mockup */
  transition: transform 0.5s ease;
  transform: rotateY(-5deg);
}

.dashboard-mockup {
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 20px 20px 40px rgba(0,0,0,0.2), -5px -5px 10px rgba(255,255,255,0.5);
  border: 4px solid #5B787C;
  background: #fff;
  /* CLEAN RENDERING - No effects */
}

/* Desktop Only Float Animation */
@media (min-width: 1024px) {
  .headline { font-size: 8rem; } /* Massive Desktop Font */

  .mockup-container {
     animation: float 6s ease-in-out infinite;
     transform: perspective(1000px) rotateY(-5deg);
  }
}

@keyframes float {
  0% { transform: perspective(1000px) rotateY(-5deg) translateY(0px); }
  50% { transform: perspective(1000px) rotateY(-5deg) translateY(-20px); }
  100% { transform: perspective(1000px) rotateY(-5deg) translateY(0px); }
}

.transform-active .mockup-container {
  animation-play-state: paused;
  transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02);
}

/* 2. Ticker Section */
.ticker-section {
  padding: 1rem 0;
  background: #5B787C;
  overflow: hidden;
  white-space: nowrap;
  transform: rotate(-1deg) scale(1.05);
  width: 100%;
  max-width: 100%;
  margin-top: -2rem; /* Pull tighter to hero */
  z-index: 10;
  position: relative;
}

.ticker-content {
  display: inline-block;
  animation: scroll 30s linear infinite;
}

.ticker-item {
  display: inline-block;
  font-family: 'Jersey 10', cursive;
  font-size: 2rem;
  margin: 0 2rem;
  color: #F4E6CF;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.separator {
  color: #A22B25;
}

/* 3. Bento Grid - TIGHTER */
.features-section {
  padding-top: 4rem; /* Reduced from 8rem */
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 300px);
  gap: 1.5rem;
}

.bento-card {
  background: rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(91, 120, 124, 0.1);
  border-radius: 30px;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  backdrop-filter: blur(10px);
}

.bento-card:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-8px);
  border-color: #5B787C;
  box-shadow: 0 20px 40px rgba(91, 120, 124, 0.15);
}

/* Grid Layout Fix */
.large {
  grid-column: span 2;
  grid-row: 1;
}
.medium {
  grid-column: span 1;
  grid-row: 1;
}
.tall {
  grid-column: span 1;
  grid-row: span 2;
  background: #5B787C;
  color: #F4E6CF;
}

/* Row 2 */
.small {
  grid-column: span 3; /* Spans remaining 3 cols */
  grid-row: 2;
}


/* Offline Badge Style */
.bento-card.offline-badge {
  background: #4A5A63;
  color: white;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
}

.offline-badge .card-content h3,
.offline-badge .card-content p {
  color: white;
  margin: 0;
}

.offline-badge .card-content h3 {
  font-size: 2.5rem;
}

.offline-icon {
  font-size: 4rem;
  opacity: 0.8;
}

.card-content h3 {
  font-family: 'Jersey 10', cursive;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #A22B25;
}

.tall .card-content h3 { color: #F4E6CF; }

.card-content p {
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.5;
}

.shield-icon {
  font-size: 6rem;
  text-align: center;
  margin-top: 40px;
  opacity: 0.8;
}

/* 4. Zigzag Section - TIGHTER */
.zigzag-section {
  display: flex;
  flex-direction: column;
  gap: 4rem; /* Reduced from 8rem */
}

.zigzag-item {
  display: flex;
  align-items: center;
  gap: 4rem;
}

.zigzag-item.reverse {
  flex-direction: row-reverse;
}

.text-box {
  flex: 1;
}

.text-box h3 {
  font-family: 'Jersey 10', cursive;
  font-size: 4rem;
  color: #A22B25;
  margin-bottom: 1.5rem;
  line-height: 0.9;
}

.text-box p {
  font-size: 1.2rem;
  line-height: 1.7;
  opacity: 0.9;
}

.visual-box {
  flex: 1;
  height: 400px;
  background: #5B787C;
  border-radius: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 20px 20px 0px rgba(162, 43, 37, 0.1);
}

.feature-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* NO FILTERS, CLEAN IMAGE */
}

.summary-visual-box::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  border: 2px dashed #F4E6CF;
  border-radius: 20px;
  pointer-events: none;
}

/* 5. Dev XP */
.dev-xp-section {
  padding-top: 4rem;
  display: flex;
  justify-content: center;
}

.code-block-container {
  background: #101622;
  border-radius: 20px;
  padding: 3rem;
  border: 4px solid #5B787C;
  box-shadow: 20px 20px 0px #A22B25;
}

.filename { color: #F4E6CF; font-family: monospace; }
.code-header .dot { animation: none; }

/* 6. Final CTA */
.final-cta {
  text-align: center;
  padding: 6rem 1rem;
}

.final-cta h2 {
  font-family: 'Jersey 10', cursive;
  font-size: 5rem;
  color: #5B787C;
  margin-bottom: 3rem;
  line-height: 0.9;
}

.pulse-btn {
  font-size: 1.4rem;
  padding: 1.2rem 3rem;
}

@keyframes scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

/* Footer */
.footer {
  background: #5B787C;
  color: #F4E6CF;
  padding: 4rem 2rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.brand-text-sm {
  font-family: 'Jersey 10', cursive;
  font-size: 2rem;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-link {
  color: #F4E6CF;
  text-decoration: none;
  font-family: 'Poppins', sans-serif;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.footer-link:hover {
  opacity: 1;
}

.copyright {
  font-size: 0.9rem;
  opacity: 0.6;
  margin-top: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 1023px) {
  /* Mobile / Tablet Hero Overhaul */
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding-top: 2rem;
    height: auto; /* Allow auto height */
  }

  .headline {
    font-size: 4.5rem; /* Still huge for mobile */
    line-height: 0.85;
  }

  .sub-headline {
    font-size: 1.25rem;
    margin: 0 auto 2rem auto;
  }

  .cta-group {
    justify-content: center;
    margin-bottom: 3rem;
  }

  .hero-visual {
    width: 100%;
    margin-top: 2rem;
    padding-bottom: 2rem;
  }

  .mockup-container {
    max-width: 100%;
    transform: none !important;
    animation: none !important;
  }

  /* Stack image above text in zigzag section */
  .zigzag-item, .zigzag-item.reverse {
    flex-direction: column-reverse; /* Puts visual (2nd child) on top */
    text-align: center;
    gap: 2rem;
  }

  .ticker-section {
    transform: none;
    margin-top: 0;
  }

  /* Navbar Mobile */
  .menu-toggle { display: block; }
  .desktop-links { display: none; }

  .mobile-menu {
    position: absolute;
    top: 70px;
    left: 0;
    width: 100%;
    background: #F4E6CF;
    flex-direction: column;
    padding: 2rem;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    transform: translateY(-150%);
    transition: transform 0.3s ease;
    z-index: 999;
    align-items: center;
    gap: 1.5rem;
    display: flex; /* Hidden via Y transform, but standard display flex */
  }

  .mobile-menu.is-open {
    transform: translateY(0);
  }

  /* Grid collapses to 1 col */
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .bento-card {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    min-height: 250px;
  }

  /* Compact Offline Badge on Mobile */
  .bento-card.offline-badge {
    min-height: auto;
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
