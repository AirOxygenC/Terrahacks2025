import React from "react";
import { Link } from "react-router-dom";
import "./welcome.css"; // You'll need to create this CSS file
import fish from "./img/fish.png";
import babystuff from "./img/babystuff.png";

function Welcome() {
  return (
    <div className="Welcome">
      <div className="welcome-container">
        <header className="welcome-header">
          <div className="welcome-content">
            <div className="logo-section">
              <img src={fish} alt="ParentPal Logo" className="welcome-fish" />
              <h1 className="welcome-title">ParentPal</h1>
              <p className="welcome-subtitle">Helping You Navigate Parenthood - One Wave At A Time</p>
            </div>

            <div className="welcome-description">
              <img src={babystuff} alt="Baby care items" className="welcome-baby-items" />
              <div className="description-text">
                <h2>Quick Health Evaluations for Your Baby</h2>
                <p>
                  Upload a photo and fill out information of your baby's symptoms to receive an AI-powered 
                assessment with guidance on next steps. Our tool helps 
                  ease the minds of parents and helps them understand when to seek medical attention.
                </p>
                
              </div>
            </div>

            <div className="cta-section">
              <Link to="/assessment" className="start-assessment-button">
                Start Health Assessment
              </Link>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}

export default Welcome;