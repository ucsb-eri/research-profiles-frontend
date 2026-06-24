import React, { useState, useEffect, useRef } from 'react';
import { fetchDivisions, DivisionGroup } from '../lib/api';

type SearchParams = { department?: string; topic?: string; name?: string; division?: string };

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
  liveSearch?: boolean; // Enable live search (search-as-you-type)
}

// The dropdown holds both departments (plain value) and "All <division>" entries
// (value prefixed so we can tell them apart on change).
const DIVISION_PREFIX = 'div:';

export default function FacultySearchBar({ onSearch, isLoading = false, liveSearch = true }: SearchBarProps) {
  const [searchParams, setSearchParams] = useState({
    topic: '',
    name: '',
    department: '',
    division: ''
  });
  const [divisions, setDivisions] = useState<DivisionGroup[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load the division/department list for the dropdown once on mount.
  useEffect(() => {
    fetchDivisions()
      .then(setDivisions)
      .catch((err) => console.error('Failed to load divisions:', err));
  }, []);

  // Live search effect - triggers fuzzy search-as-you-type after the user
  // stops typing for 400ms. Watches both the name and topic/expertise fields.
  useEffect(() => {
    if (!liveSearch) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const queryText = `${searchParams.name} ${searchParams.topic}`.trim();

    // Trigger live search once the combined query has at least 2 characters
    if (queryText.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        const params: SearchParams = {};
        if (searchParams.name.trim()) params.name = searchParams.name.trim();
        if (searchParams.topic.trim()) params.topic = searchParams.topic.trim();
        if (searchParams.department.trim()) params.department = searchParams.department.trim();
        if (searchParams.division.trim()) params.division = searchParams.division.trim();

        setHasSearched(true);
        onSearch(params);
      }, 400); // 400ms debounce delay
    } else if (queryText.length === 0 && hasSearched) {
      // If the text fields are cleared, fall back to department/division filter / all results
      const params: SearchParams = {};
      if (searchParams.department.trim()) params.department = searchParams.department.trim();
      if (searchParams.division.trim()) params.division = searchParams.division.trim();
      onSearch(params);
    }

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.name, searchParams.topic, liveSearch]); // Trigger on name or topic changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only include non-empty parameters
    const params: SearchParams = {};
    if (searchParams.topic.trim()) params.topic = searchParams.topic.trim();
    if (searchParams.name.trim()) params.name = searchParams.name.trim();
    if (searchParams.department.trim()) params.department = searchParams.department.trim();
    if (searchParams.division.trim()) params.division = searchParams.division.trim();

    setHasSearched(true);
    onSearch(params);
  };

  const handleClear = () => {
    setSearchParams({ topic: '', name: '', department: '', division: '' });
    setHasSearched(false);
    onSearch({}); // Reset to show all faculty
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const formEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(formEvent);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      {/* Row of fields */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 32,
          width: '100%',
          flexWrap: 'wrap',
          marginBottom: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 2, minWidth: 320, display: 'flex', flexDirection: 'column' }}>
          <label
            htmlFor="topic"
            style={{
              fontWeight: 700,
              color: 'var(--ucsb-navy)',
              fontSize: 22,
              marginBottom: 8,
              display: 'block',
            }}
          >
            Research Topic/Expertise
          </label>
          <input
            id="topic"
            type="text"
            value={searchParams.topic}
            onChange={(e) => setSearchParams(prev => ({ ...prev, topic: e.target.value }))}
            placeholder="e.g., climate change, marine biology (typo-tolerant)"
            style={{
              width: '100%',
              fontSize: 22,
              padding: '1.2em 1.2em',
              border: searchParams.topic ? '2px solid var(--ucsb-navy)' : '2px solid #bfc9d1',
              borderRadius: 6,
              fontFamily: 'Nunito Sans, sans-serif',
              boxSizing: 'border-box',
              height: 64,
              marginBottom: 0,
              backgroundColor: searchParams.topic ? '#f8f9ff' : 'white',
              color: searchParams.topic ? 'var(--ucsb-navy)' : '#374151',
              fontWeight: searchParams.topic ? '600' : '400',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--ucsb-gold)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          />

        </div>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
          <label
            htmlFor="name"
            style={{
              fontWeight: 700,
              color: 'var(--ucsb-navy)',
              fontSize: 22,
              marginBottom: 8,
              display: 'block',
            }}
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={searchParams.name}
            onChange={(e) => setSearchParams(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Last name recommended"
            style={{
              width: '100%',
              fontSize: 22,
              padding: '1.2em 1.2em',
              border: searchParams.name ? '2px solid var(--ucsb-navy)' : '2px solid #bfc9d1',
              borderRadius: 6,
              fontFamily: 'Nunito Sans, sans-serif',
              boxSizing: 'border-box',
              height: 64,
              marginBottom: 0,
              backgroundColor: searchParams.name ? '#f8f9ff' : 'white',
              color: searchParams.name ? 'var(--ucsb-navy)' : '#374151',
              fontWeight: searchParams.name ? '600' : '400',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--ucsb-gold)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          />

        </div>
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column' }}>
          <label
            htmlFor="department"
            style={{
              fontWeight: 700,
              color: 'var(--ucsb-navy)',
              fontSize: 22,
              marginBottom: 8,
              display: 'block',
            }}
          >
            Department / Division
          </label>
          <select
            id="department"
            value={searchParams.division ? DIVISION_PREFIX + searchParams.division : searchParams.department}
            onChange={(e) => {
              const val = e.target.value;
              if (val.startsWith(DIVISION_PREFIX)) {
                // "All <division>" selected: filter by division, clear department.
                setSearchParams(prev => ({ ...prev, division: val.slice(DIVISION_PREFIX.length), department: '' }));
              } else {
                // A specific department (or "All Departments"): clear division.
                setSearchParams(prev => ({ ...prev, department: val, division: '' }));
              }
            }}
            style={{
              width: '100%',
              fontSize: 18,
              padding: '0.8em 1.2em',
              border: (searchParams.department || searchParams.division) ? '2px solid var(--ucsb-navy)' : '2px solid #bfc9d1',
              borderRadius: 6,
              fontFamily: 'Nunito Sans, sans-serif',
              boxSizing: 'border-box',
              height: 64,
              marginBottom: 0,
              backgroundColor: (searchParams.department || searchParams.division) ? '#f8f9ff' : 'white',
              color: (searchParams.department || searchParams.division) ? 'var(--ucsb-navy)' : '#374151',
              fontWeight: (searchParams.department || searchParams.division) ? '600' : '400',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--ucsb-gold)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            <option value="">All Departments</option>
            {divisions.map(group => (
              <optgroup key={group.division} label={group.division}>
                <option value={DIVISION_PREFIX + group.division}>All {group.division}</option>
                {group.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </optgroup>
            ))}
          </select>

        </div>
      </div>
      
      {/* Search buttons */}
      <div style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: 'var(--ucsb-navy)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '1rem 2rem',
            fontSize: 18,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            fontFamily: 'Nunito Sans, sans-serif',
            transition: 'background-color 0.2s, transform 0.1s',
            minHeight: 44,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--ucsb-gold)';
              e.currentTarget.style.color = 'var(--ucsb-navy)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--ucsb-navy)';
              e.currentTarget.style.color = 'white';
            }
          }}
        >
          {isLoading ? 'Searching...' : 'Search Faculty'}
        </button>
        
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--ucsb-navy)',
            border: '2px solid var(--ucsb-navy)',
            borderRadius: 6,
            padding: '1rem 2rem',
            fontSize: 18,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            fontFamily: 'Nunito Sans, sans-serif',
            transition: 'border-color 0.2s, color 0.2s, background-color 0.2s',
            minHeight: 44,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = 'var(--ucsb-gold)';
              e.currentTarget.style.color = 'var(--ucsb-gold)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = 'var(--ucsb-navy)';
              e.currentTarget.style.color = 'var(--ucsb-navy)';
            }
          }}
        >
          Clear Search
        </button>
      </div>
    </form>
  );
} 