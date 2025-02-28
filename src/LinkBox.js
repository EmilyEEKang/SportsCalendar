import React from 'react';

const LinkBox = ({ value, onChange }) => {
  return (
    <div className="link-box">
      <textarea
        className="large-text-box"
        rows="10"
        placeholder="Insert links here, separated by a new line, space, or comma."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default LinkBox;