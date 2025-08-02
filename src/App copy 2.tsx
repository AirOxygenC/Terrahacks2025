import './App.css';
import React, { useState } from 'react';
import Checkboxes from './checkboxes';
import FeedingType from './dropbox';
import NumberRestrictedTextarea from './textarea.tsx'; // adjust path
import ExtraNotes from './notes.tsx';
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
        Choose an image to upload
        <form onSubmit={formSubmit}>
          <input type="file" onChange={(e) => convertFile(e.target.files)} />
          
          <hr />
          {filebase64 && (
            <>
              {filebase64.includes("image/") && <img src={filebase64} width={300} />}
              <hr />
              <button>Submit image and symptoms</button>
            </>
          )
          
          }
          
        <div>
          <Checkboxes
            label="Select Location of Issue"
            options={['Legs', 'Face', 'Hand', 'Chest', 'Back', 'Neck', 'Arms', 'Feet']}
            selected={location}
            setSelected={setLocation}
          />

<FeedingType
  feedingType={feedingType}
  setFeedingType={setFeedingType}
  customFeedText={customFeedText}
  setCustomFeedText={setCustomFeedText}
  stoolColor={stoolColor}
  setStoolColor={setStoolColor}
/>
<NumberRestrictedTextarea
  value={numberText}
  setValue={setNumberText}
  secondValue={durationText}
  setSecondValue={setDurationText}
  thirdValue={temperatureText}
  setThirdValue={setTemperatureText}

/>

<ExtraNotes notes={extraNotes} setNotes={setExtraNotes} />
</div>
      <button type="submit">Submit</button>

          
        </form>
      </header>
    </div>
  );
}

export default App;
