import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const toggleSelect = () => setIsOpen(!isOpen);

  const handleOptionClick = (month) => {
    onChange({ target: { value: month } });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-select" ref={selectRef}>
      <button className={`pl ${isOpen ? 'on' : ''}`} onClick={toggleSelect}>
        {value} 월
      </button>
      {isOpen && (
        <ul className="listbox">
          {Array.from({ length: 12 }, (_, i) => (
            <li key={i + 1}>
              <button className="list" onClick={() => handleOptionClick(i + 1)}>
                {i + 1} 월
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;