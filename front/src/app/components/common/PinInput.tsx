'use client';
import React, { useRef, useState } from 'react';
import styles from './PinInput.module.scss';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({ length = 6, onComplete, disabled }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.slice(-1);
    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);

    const combinedPin = newValues.join('');
    if (combinedPin.length === length) {
      onComplete(combinedPin);
    } else if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').slice(0, length);
    const newValues = Array(length).fill('');
    pastedText.split('').forEach((char, index) => {
      newValues[index] = char;
    });
    setValues(newValues);
    if(pastedText.length === length) {
        onComplete(pastedText);
    }
  };

  return (
    <div dir="ltr" className={styles.pinContainer} onPaste={handlePaste}>
      {values.map((value, index) => (
        <input
          key={index}
          // --- FIX IS HERE: Wrapped the assignment in curly braces ---
          ref={(el) => { 
            inputsRef.current[index] = el; 
          }}
          // -----------------------------------------------------------
          type="text"
          inputMode="numeric"
          pattern="\d{1}"
          maxLength={1}
          className={styles.pinInput}
          value={value}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};