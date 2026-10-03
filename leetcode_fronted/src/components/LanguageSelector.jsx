import { useState, useRef, useEffect } from 'react';

const languages = [
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];

export function LanguageSelector({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedLang = languages.find((l) => l.id === value) || languages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-sm font-medium text-base-content hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{selectedLang.id === 'cpp' ? '🔷' : selectedLang.id === 'java' ? '☕' : '🟨'}</span>
        <span>{selectedLang.label}</span>
        <span className="ml-1">▼</span>
      </button>

      {isOpen && (
        <ul
          ref={dropdownRef}
          className="absolute right-0 mt-1 w-40 bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in"
          role="listbox"
        >
          {languages.map((lang) => (
            <li key={lang.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(lang.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  value === lang.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content hover:bg-base-200'
                }`}
                role="option"
                aria-selected={value === lang.id}
              >
                <span className="text-lg">{lang.id === 'cpp' ? '🔷' : lang.id === 'java' ? '☕' : '🟨'}</span>
                <span>{lang.label}</span>
                {value === lang.id && <span className="ml-auto text-primary">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}