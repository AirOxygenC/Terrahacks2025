// checkboxes.tsx
import React from 'react';

interface CheckboxesProps {
  label: string;
  options: string[];
  selected: string[];
  setSelected: (selected: string[]) => void;
}

const Checkboxes: React.FC<CheckboxesProps> = ({ label, options, selected, setSelected }) => {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      setSelected(selected.filter((item) => item !== option));
    } else {
      setSelected([...selected, option]);
    }
  };

  return (
    <div className="checkbox-group" style={{ marginTop: '1rem' }}>
      <label style={{ fontWeight: 'bold' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
      {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
            />
            {' '}{option}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Checkboxes;
