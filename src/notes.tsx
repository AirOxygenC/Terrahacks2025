import React from "react";
import "./notes.css";

type ExtraNotesProps = {
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
};

function ExtraNotes({ notes, setNotes }: ExtraNotesProps) {
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value);
  }

  return (
    <div style={{ marginTop: "1em", textAlign: "center" }}>
      <label
        id="extra-notes"
        htmlFor="extra-notes"
        style={{ display: "block", marginBottom: "0.5em" }}
      >
        Extra notes about the baby:
      </label>
      <textarea
        id="extra-notes"
        value={notes}
        onChange={handleChange}
        rows={6}
        cols={48}
        placeholder="Enter any additional information here"
        style={{ resize: "none" }}

      />
    </div>
  );
}

export default ExtraNotes;
