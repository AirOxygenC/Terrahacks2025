import "./App.css";
import React, { useState } from "react";
import Checkboxes from "./checkboxes.tsx";
import FeedingType from "./dropbox.tsx";
import NumberRestrictedTextarea from "./textarea.tsx";
import ExtraNotes from "./notes.tsx";
import { Link } from "react-router-dom";
import mascot from "./img/mascot.png";

const API_BASE_URL = "http://localhost:5000"; // Update this to your backend URL

function App() {
  const [filebase64, setFileBase64] = useState<string>("");
  const [location, setLocation] = useState<string[]>([]);
  const [feedingType, setFeedingType] = useState("");
  const [stoolColor, setStoolColor] = useState("");
  const [numberText, setNumberText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [temperatureText, setTemperatureText] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  // New states for backend integration
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ type: "user" | "bot"; message: string }>
  >([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [error, setError] = useState("");

  async function formSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = {
        location,
        feedingType,
        stoolColor,
        numberText,
        durationText,
        temperatureText,
        extraNotes,
        image: filebase64, // Include the base64 image
      };

      const response = await fetch(`${API_BASE_URL}/submit-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAssessment(result.assessment);
        setSessionId(result.session_id);
        setShowAssessment(true);
      } else {
        setError(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setError("Failed to submit assessment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendChatMessage() {
    if (!currentMessage.trim() || !sessionId) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage("");

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { type: "user", message: userMessage },
    ]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setChatMessages((prev) => [
          ...prev,
          { type: "bot", message: result.response },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            message: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          message: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    }
  }

  function convertFile(files: FileList | null) {
    if (files) {
      const fileRef = files[0] || "";
      const fileType: string = fileRef.type || "";
      const reader = new FileReader();
      reader.readAsBinaryString(fileRef);
      reader.onload = (ev: any) => {
        setFileBase64(`data:${fileType};base64,${btoa(ev.target.result)}`);
      };
    }
  }

  // If assessment is shown, display the results and chat interface
  if (showAssessment) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="sideBar">
            <label className="Title1">
              Baby Health <br></br>
            </label>
            <label className="Title2">AI</label>
          </div>

          <div className="assessment-container">
            <div className="assessment-result">
              <h2>Health Assessment Results</h2>
              <div className="assessment-text">
                {assessment.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="chat-container">
              <h3>Ask Follow-up Questions</h3>
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`message ${msg.type}`}>
                    <strong>{msg.type === "user" ? "You: " : "AI: "}</strong>
                    {msg.message}
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Ask a follow-up question..."
                  className="chat-text-input"
                />
                <button onClick={sendChatMessage} className="chat-send-button">
                  Send
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAssessment(false);
                setAssessment("");
                setSessionId("");
                setChatMessages([]);
                // Reset form
                setFileBase64("");
                setLocation([]);
                setFeedingType("");
                setStoolColor("");
                setNumberText("");
                setDurationText("");
                setTemperatureText("");
                setExtraNotes("");
              }}
              className="new-assessment-button"
            >
              New Assessment
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="sideBar">
          <label className="Title1">
            Baby Health <br></br>
          </label>
          <label className="Title2">AI</label>
        </div>

        {error && (
          <div className="error-message">
            <p style={{ color: "red" }}>{error}</p>
          </div>
        )}

        <form onSubmit={formSubmit}>
          <div className="form-layout">
            {/* Left side: image uploader */}
            <div className="form-left">
              <label className="form-label">Choose an image to upload</label>
              <br />

              {/* Always show a preview box — with image or placeholder inside */}
              <div className="image-preview-box">
                {!filebase64 ? (
                  <div className="placeholder-box">
                    Image preview will appear here
                  </div>
                ) : (
                  <img src={filebase64} alt="Uploaded preview" />
                )}
              </div>
              <input
                type="file"
                onChange={(e) => convertFile(e.target.files)}
                accept="image/*"
              />
            </div>

            {/* Right side: form controls */}
            <div className="form-right">
              <label className="details">
                FURTHER DETAILS <br></br>
              </label>
              <label className="detailsWriting">
                Enter additional information on your baby's symptoms for better
                assessment.
              </label>
              <div className="checkbox-section">
                <Checkboxes
                  label="Select Location of Issue"
                  options={[
                    "Legs",
                    "Face",
                    "Hand",
                    "Chest",
                    "Back",
                    "Neck",
                    "Arms",
                    "Feet",
                  ]}
                  selected={location}
                  setSelected={setLocation}
                />
              </div>

              <div className="typesection">
                <label className="dropdown">Additional Context</label>
                <FeedingType
                  feedingType={feedingType}
                  setFeedingType={setFeedingType}
                  stoolColor={stoolColor}
                  setStoolColor={setStoolColor}
                />
              </div>

              <div className="textarea-section">
                <NumberRestrictedTextarea
                  value={numberText}
                  setValue={setNumberText}
                  secondValue={durationText}
                  setSecondValue={setDurationText}
                  thirdValue={temperatureText}
                  setThirdValue={setTemperatureText}
                />
              </div>

              <div className="extra-notes-section">
                <ExtraNotes notes={extraNotes} setNotes={setExtraNotes} />
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "ANALYZING..." : "SUBMIT"}
            </button>

            <div>
              <img src={mascot} alt="My local image" className="ourMascot" />
            </div>
          </div>
        </form>
      </header>
    </div>
  );
}

export default App;
