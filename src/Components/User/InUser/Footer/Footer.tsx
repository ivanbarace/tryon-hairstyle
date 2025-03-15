import React, { useEffect, useRef } from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const featuresRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          } else {
            entry.target.classList.remove('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    if (footerRef.current) observer.observe(footerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section ref={featuresRef} className="features-section animate-on-scroll">
        <h2 className="section-title">Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Smart Recommendations</h3>
            <p>Get personalized hairstyle suggestions based on your face shape, features, and style preferences.</p>
          </div>
          <div className="feature-card">
            <h3>Virtual Try-On</h3>
            <p>Scan your face once, preview different hairstyles, and save your favorite looks for future reference.</p>
          </div>
          <div className="feature-card">
            <h3>User-Friendly Interface</h3>
            <p>Enjoy a seamless experience with our intuitive design and easy-to-use features on any device.</p>
          </div>
        </div>
      </section>

      <section ref={aboutRef} className="about-section animate-on-scroll">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About Us</h2>
              <p>Welcome to HairStyle AI, where technology meets beauty. Our advanced AI system helps you discover the perfect hairstyle that matches your Faceshape and personality.</p>
              <p>We are dedicated to providing an innovative solution that makes hairstyle selection easy, fun, and personalized for everyone.</p>
            </div>
            <div className="about-image">
              <img src="/aboutus.jpg" alt="About Us" />
            </div>
          </div>
        </div>
      </section>

      <footer ref={footerRef} className="main-footer animate-on-scroll">
        <div className="footer-content">
          <div className="footer-sections">
            <div className="footer-section">
              <h3>Contact Us</h3>
              <p>Email: ivanbarace035@gmail.com</p>
              <p>Phone: 09930912216</p>
            </div>
            <div className="footer-section">
              <h3>Location</h3>
              <p>Ubojan, Antequera, Bohol</p>
              <p>Available 24/7</p>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <p>Facebook</p>
              <p>Instagram</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Developed by HairStyle Team</p>
            <p>© 2024 HairStyle. All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
