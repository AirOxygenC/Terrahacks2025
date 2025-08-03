import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const NewPage: React.FC = () => {
  const randomNumber = Math.floor(Math.random() * 100) + 1;

  useEffect(() => {
    // Remove all existing stylesheets temporarily
    const styleSheets = document.querySelectorAll(
      'link[rel="stylesheet"], style'
    );
    const removedStyles: Element[] = [];

    styleSheets.forEach((sheet) => {
      if (
        sheet.textContent?.includes(".sideBar") ||
        sheet.getAttribute("href")?.includes("app.css")
      ) {
        removedStyles.push(sheet);
        sheet.remove();
      }
    });

    // Cleanup function to restore styles when leaving page
    return () => {
      removedStyles.forEach((sheet) => {
        document.head.appendChild(sheet);
      });
    };
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f0f8ff",
        height: "100vh",
        width: "50vw",
        position: "fixed",
        top: 0,
        left: 40,
        zIndex: 9999,
      }}
    >
      <h1>Welcome to the New Page!</h1>
      <p>
        Here's a random number just for you: <strong>{randomNumber}</strong>
      </p>
      <p>Isn't randomness fun?</p>
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
