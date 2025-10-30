import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (params: { department?: string; topic?: string; name?: string }) => void;
  isLoading?: boolean;
  liveSearch?: boolean; // Enable live search (search-as-you-type)
}

export default function FacultySearchBar({ onSearch, isLoading = false, liveSearch = true }: SearchBarProps) {
  const [searchParams, setSearchParams] = useState({
    topic: '',
    name: '',
    department: ''
  });
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Live search effect - triggers search after user stops typing for 500ms
  useEffect(() => {
    if (!liveSearch) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only trigger live search if name field has at least 2 characters
    if (searchParams.name.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        const params: { department?: string; topic?: string; name?: string } = {};
        if (searchParams.name.trim()) params.name = searchParams.name.trim();
        if (searchParams.topic.trim()) params.topic = searchParams.topic.trim();
        if (searchParams.department.trim()) params.department = searchParams.department.trim();
        
        setHasSearched(true);
        onSearch(params);
      }, 500); // 500ms debounce delay
    } else if (searchParams.name.trim().length === 0 && hasSearched) {
      // If name field is cleared, show all results
      const params: { department?: string; topic?: string; name?: string } = {};
      if (searchParams.topic.trim()) params.topic = searchParams.topic.trim();
      if (searchParams.department.trim()) params.department = searchParams.department.trim();
      onSearch(params);
    }

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.name, liveSearch]); // Only trigger on name changes for live search

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only include non-empty parameters
    const params: { department?: string; topic?: string; name?: string } = {};
    if (searchParams.topic.trim()) params.topic = searchParams.topic.trim();
    if (searchParams.name.trim()) params.name = searchParams.name.trim();
    if (searchParams.department.trim()) params.department = searchParams.department.trim();
    
    setHasSearched(true);
    onSearch(params);
  };

  const handleClear = () => {
    setSearchParams({ topic: '', name: '', department: '' });
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
            placeholder="e.g., climate change, marine biology, oceanography"
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
            Department
          </label>
          <select
            id="department"
            value={searchParams.department}
            onChange={(e) => setSearchParams(prev => ({ ...prev, department: e.target.value }))}
            style={{
              width: '100%',
              fontSize: 18,
              padding: '0.8em 1.2em',
              border: searchParams.department ? '2px solid var(--ucsb-navy)' : '2px solid #bfc9d1',
              borderRadius: 6,
              fontFamily: 'Nunito Sans, sans-serif',
              boxSizing: 'border-box',
              height: 64,
              marginBottom: 0,
              backgroundColor: searchParams.department ? '#f8f9ff' : 'white',
              color: searchParams.department ? 'var(--ucsb-navy)' : '#374151',
              fontWeight: searchParams.department ? '600' : '400',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <option value="">All Departments</option>
            <option value="Black Studies">Black Studies</option>
            <option value="Earth Science">Earth Science</option>
            <option value="Ecology, Evolution, and Marine Biology">Ecology, Evolution, and Marine Biology</option>
            <option value="Economics">Economics</option>
            <option value="Geography">Geography</option>
            <option value="Marine Science Graduate Program">Marine Science Graduate Program</option>
            <option value="Physics">Physics</option>
            <option value="Electrical and Computer Engineering">Electrical and Computer Engineering</option>
            <option value="Anthropology">Anthropology</option>
            <option value="Asian American Studies">Asian American Studies</option>
            <option value="Computer Science">Computer Science</option>
            <option value="English">English</option>
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
          }}
        >
          Clear Search
        </button>
      </div>
    </form>
  );
} 