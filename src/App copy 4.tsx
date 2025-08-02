import "./App.css";
import React, { useState } from "react";
import Checkboxes from "./checkboxes.tsx";
import FeedingType from "./dropbox.tsx";
import NumberRestrictedTextarea from "./textarea.tsx"; // adjust path
import ExtraNotes from "./notes.tsx";
function App() {
  const [filebase64, setFileBase64] = useState<string>("");
  const [location, setLocation] = useState<string[]>([]);
  const [feedingType, setFeedingType] = useState("");
  const [customFeedText, setCustomFeedText] = useState("");
  const [stoolColor, setStoolColor] = useState("");
  const [numberText, setNumberText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [temperatureText, setTemperatureText] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  function formSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({
      filebase64,
      location,
      feedingType,
    });
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

  return (
    <div className="App">
      <header className="App-header">
        <div className="sideBar">
          <label className="Title1">
            Baby Health <br></br>
          </label>
          <label className="Title2">AI</label>
        </div>
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
              />
            </div>

            {/* Right side: form controls */}
            <div className="form-right">
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

              <div className="feeding-type-section">
                <FeedingType
                  feedingType={feedingType}
                  setFeedingType={setFeedingType}
                  customFeedText={customFeedText}
                  setCustomFeedText={setCustomFeedText}
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
            <button type="submit" className="submit-button">
              Submit
            </button>
          </div>
        </form>
      </header>
    </div>
  );
}

export default App;
