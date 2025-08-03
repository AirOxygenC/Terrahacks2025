import React from "react";

interface Props {
  feedingType: string;
  setFeedingType: (val: string) => void;
  //customFeedText: string;
  //setCustomFeedText: (val: string) => void;
  stoolColor: string;
  setStoolColor: (val: string) => void;
}

const FeedingType: React.FC<Props> = ({
  feedingType,
  setFeedingType,
  //customFeedText,
  //setCustomFeedText,
  stoolColor,
  setStoolColor,
}) => {
  return (
    <div>
      {/* Feeding Type */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginTop: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Feeding Type */}
        <div>
          <label htmlFor="feeding">Type of Feeding:</label>
          <select
            id="feeding"
            value={feedingType}
            onChange={(e) => setFeedingType(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="">-- Select --</option>
            <option value="Breastfeeding">Breastfeeding</option>
            <option value="Formula">Formula</option>
            <option value="Solid">Solid</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>

        {/* Stool Color */}
        <div>
          <label htmlFor="stoolColor">Stool Color:</label>
          <select
            id="stoolColor"
            value={stoolColor}
            onChange={(e) => setStoolColor(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="">-- Select --</option>
            <option value="Brown">Brown</option>
            <option value="Green">Green</option>
            <option value="Dark Green">Dark Green</option>
            <option value="Red">Red</option>
            <option value="Black">Black</option>
            <option value="White-Gray">White-Gray</option>
            <option value="Yellow">Yellow</option>
            <option value="Tan-Yellow">Tan-Yellow</option>
          </select>
        </div>

        {feedingType === "Other" && (
          <div style={{ marginTop: "0.5rem" }}>
            <input
              type="text"
              placeholder="Enter feeding type"
              //value={customFeedText}
              //onChange={(e) => setCustomFeedText(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedingType;
