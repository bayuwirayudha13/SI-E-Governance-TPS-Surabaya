import React, { useState, useRef, useEffect, useMemo } from 'react';

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "— Pilih —",
  searchPlaceholder = "Cari...",
  disabled = false,
  required = false,
  multiple = false,
  getOptionLabel = (opt) => opt.nama || opt,
  getOptionValue = (opt) => opt.id || opt,
  getOptionDescription,
  className = "",
  allowClear = true,
  onSearch = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Handle controlled/uncontrolled value
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : selectedOptions;

  // Convert single value to array for internal handling
  const valueArray = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
    }
    return currentValue ? [currentValue] : [];
  }, [currentValue, multiple]);

  // Update selectedOptions when value changes
  useEffect(() => {
    if (isControlled) {
      setSelectedOptions(valueArray);
    }
  }, [valueArray, isControlled]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt => 
      getOptionLabel(opt).toLowerCase().includes(query) ||
      (getOptionDescription && getOptionDescription(opt).toLowerCase().includes(query))
    );
  }, [options, searchQuery, getOptionLabel, getOptionDescription]);

  // Check if option is selected
  const isOptionSelected = (opt) => {
    const optValue = getOptionValue(opt);
    return valueArray.some(v => v === optValue);
  };

  // Get selected option labels for display
  const selectedLabels = valueArray.map(v => {
    const opt = options.find(o => getOptionValue(o) === v);
    return opt ? getOptionLabel(opt) : v;
  });

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return;
    }

    const visibleOptions = filteredOptions.filter(opt => !multiple || !isOptionSelected(opt));
    const selectedIndices = visibleOptions.map((_, i) => i);
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery("");
      containerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus next option
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Focus previous option
    } else if (e.key === 'Enter') {
      // Handled by option click
    }
  };

  const handleSelect = (opt) => {
    const optValue = getOptionValue(opt);
    
    if (multiple) {
      const newValues = isOptionSelected(opt) 
        ? valueArray.filter(v => v !== optValue)
        : [...valueArray, optValue];
      
      if (!isControlled) {
        setSelectedOptions(newValues);
      }
      onChange?.(newValues);
    } else {
      if (!isControlled) {
        setSelectedOptions([optValue]);
      }
      onChange?.(optValue);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (!isControlled) {
      setSelectedOptions([]);
    }
    onChange?.(multiple ? [] : null);
    setSearchQuery("");
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleContainerClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Render selected value(s)
  const renderSelected = () => {
    if (multiple) {
      if (valueArray.length === 0) {
        return <span className="searchable-select-placeholder">{placeholder}</span>;
      }
      return (
        <div className="searchable-select-tags">
          {valueArray.map((v, i) => {
            const opt = options.find(o => getOptionValue(o) === v);
            const label = opt ? getOptionLabel(opt) : v;
            return (
              <span key={i} className="searchable-select-tag">
                {label}
                <button type="button" className="searchable-select-tag-remove" onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt);
                }}>×</button>
              </span>
            );
          })}
        </div>
      );
    }
    
    if (valueArray.length === 0) {
      return <span className="searchable-select-placeholder">{placeholder}</span>;
    }
    return <span>{selectedLabels[0]}</span>;
  };

  return (
    <div className={`searchable-select-container ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={containerRef} onClick={handleContainerClick} tabIndex={0} onKeyDown={handleKeyDown}>
      <label className="searchable-select-label">{label}{required && <span className="required">*</span>}</label>
      
      <div className="searchable-select-trigger">
        <div className="searchable-select-value">{renderSelected()}</div>
        {allowClear && valueArray.length > 0 && !disabled && (
          <button type="button" className="searchable-select-clear" onClick={handleClear} aria-label="Hapus pilihan">×</button>
        )}
        <svg className="searchable-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown" ref={listRef}>
          <input
            ref={inputRef}
            type="text"
            className="searchable-select-search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setIsOpen(false);
              }
            }}
            autoFocus
          />
          
          <div className="searchable-select-options" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                {searchQuery ? `Tidak ditemukan "${searchQuery}"` : 'Tidak ada pilihan'}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const selected = isOptionSelected(opt);
                const optLabel = getOptionLabel(opt);
                const optDesc = getOptionDescription ? getOptionDescription(opt) : null;
                
                if (multiple && selected) return null;
                
                return (
                  <div
                    key={index}
                    className={`searchable-select-option ${selected ? 'selected' : ''}`}
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(opt)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="searchable-select-option-content">
                      <span className="searchable-select-option-label">{optLabel}</span>
                      {optDesc && <span className="searchable-select-option-description">{optDesc}</span>}
                    </div>
                    {selected && (
                      <svg className="searchable-select-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}