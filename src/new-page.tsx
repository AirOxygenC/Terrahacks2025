import React from "react";
import { Link } from "react-router-dom";

const NewPage: React.FC = () => {
  const randomNumber = Math.floor(Math.random() * 100) + 1;

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f0f8ff",
        height: "100vh",
      }}
    >
      <h1>Welcome to the New Page!</h1>
      <p>
        Here’s a random number just for you: <strong>{randomNumber}</strong>
      </p>
      <p>Isn’t randomness fun?</p>
      <Link to="/">
        <button
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
            borderRadius: "5px",
            border: "none",
            backgroundColor: "#007bff",
            color: "white",
          }}
        >
          Go Back Home
        </button>
      </Link>
    </div>
  );
};

export default NewPage;
