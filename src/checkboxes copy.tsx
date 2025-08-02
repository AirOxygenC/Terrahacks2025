import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './checkboxes.css';

import React,{ useState }  from 'react';
interface CheckboxGroupProps {
    label: string;
    options: string[];
    selected: string[];
    setSelected: (values: string[]) => void;
  }
  
  const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    label,
    options,
    selected,
    setSelected,
  }) => {
    const handleChange = (option: string) => {
      if (selected.includes(option)) {
        setSelected(selected.filter((item) => item !== option));
      } else {
        setSelected([...selected, option]);
      }
    };
  
    return (
      <div className="my-4">
        <label className="block font-medium mb-1">{label}</label>
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleChange(option)}
                className="accent-blue-500"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };
  
  export default location;