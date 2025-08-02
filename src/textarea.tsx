import React from "react";

type NumberRestrictedTextareaProps = {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  secondValue: string;
  setSecondValue: React.Dispatch<React.SetStateAction<string>>;
  thirdValue: string;
  setThirdValue: React.Dispatch<React.SetStateAction<string>>;
};

function NumberRestrictedTextarea({
  value,
  setValue,
  secondValue,
  setSecondValue,
  thirdValue,
  setThirdValue,
}: NumberRestrictedTextareaProps) {
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const input = e.target.value;
    if (/^[0-9.\n\r]*$/.test(input)) {
      setValue(input);
    }
  }

  function handleSecondChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const input = e.target.value;
    if (/^[0-9.\n\r]*$/.test(input)) {
      setSecondValue(input);
    }
  }
  function handleThirdChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const input = e.target.value;
    if (/^[0-9.\n\r]*$/.test(input)) {
      setThirdValue(input);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
        <label htmlFor="num-textarea">
          Baby's age in months (only enter numbers):
        </label>
        <br />
        <textarea
          id="num-textarea"
          value={value}
          onChange={handleChange}
          rows={1}
          cols={4}
          placeholder="Only numbers allowed"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
        <label htmlFor="second-textarea">
          The duration of symptoms (In days):
        </label>
        <br />
        <textarea
          id="second-textarea"
          value={secondValue}
          onChange={handleSecondChange}
          rows={1}
          cols={4}
          placeholder="Only numbers allowed"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
        <label htmlFor="third-textarea">Baby's Temperature (Celcius):</label>
        <br />
        <textarea
          id="third-textarea"
          value={thirdValue}
          onChange={handleThirdChange}
          rows={1}
          cols={4}
          placeholder="Only numbers allowed"
        />
      </div>
    </div>
  );
}

export default NumberRestrictedTextarea;
