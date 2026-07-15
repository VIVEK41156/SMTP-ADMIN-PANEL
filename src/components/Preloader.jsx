import React, { useEffect, useState } from 'react';
import './Preloader.css';

export default function Preloader({ onFinish }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fade out after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1500);

    // Completely unmount after 2 seconds
    const unmountTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onFinish]);

  return (
    <div className={`preloader-overlay ${fade ? 'fade-out' : ''}`}>
      <div className="preloader-content">
        <div className="logo-spinner-container">
          {/* Outer glowing rings */}
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
          
          {/* Inner Badge */}
          <div className="badge-center">
            <span className="badge-text">W</span>
          </div>
        </div>
        
        <div className="preloader-text">
          <h2>Web Digital <span>Mantra</span></h2>
          <p>Initializing SMTP Engine...</p>
        </div>
      </div>
    </div>
  );
}
