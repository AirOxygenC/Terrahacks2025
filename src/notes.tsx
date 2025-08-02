import React from "react";

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
        htmlFor="extra-notes"
        style={{ display: "block", marginBottom: "0.5em" }}
      >
        Extra notes about the baby:
      </label>
      <textarea
        id="extra-notes"
        value={notes}
        onChange={handleChange}
        rows={5}
        cols={40}
        placeholder="Enter any additional information here"
      />
    </div>
  );
}

export default ExtraNotes;
