import React, { useEffect, useState } from 'react';
import FacultyCard, { Faculty } from '../components/FacultyCard';
import FacultySearchBar from '../components/FacultySearchBar';
import { fetchFaculty } from '../lib/api';

// Backend faculty type
interface BackendFaculty {
  id: number;
  name: string;
  title?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  office?: string;
  website?: string;
  photo_url?: string;
  research_areas?: string;
  department: string;
  profile_url?: string;
}

export default function HomePage() {
  const [faculty, setFaculty] = useState<BackendFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Initial faculty fetch - this should only run once');
    setLoading(true);
    fetchFaculty()
      .then((results) => {
        console.log('Faculty data loaded:', results.length, 'faculty members');
        setFaculty(results);
      })
      .catch((err) => {
        console.error('Faculty fetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (params: { department?: string; topic?: string; name?: string }) => {
    console.log('Search triggered with params:', params);
    setLoading(true);
    setError(null);
    try {
      const results = await fetchFaculty(params);
      console.log('Search results:', results.length, 'faculty members');
      setFaculty(results);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
      {/* Top white bar with UCSB Research */}
      <div style={{
        background: 'var(--ucsb-white)',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.75rem 0',
        textAlign: 'left',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{
            color: 'var(--ucsb-navy)',
            fontWeight: 800,
            fontSize: 32,
            fontFamily: 'Nunito Sans, sans-serif',
            letterSpacing: '-0.5px',
          }}>
            UCSB Research
          </span>
        </div>
      </div>

      {/* Main content area with gray background */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Large main title */}
        <h1 style={{
          margin: '2.5rem 0 1.5rem 0',
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: -1,
          color: 'var(--ucsb-navy)',
          textAlign: 'left',
        }}>
          Find UCSB Faculty
        </h1>
        {/* Search/filter bar */}
        <FacultySearchBar onSearch={handleSearch} isLoading={loading} />
        {/* Divider below search bar */}
        <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '2.5rem 0 2rem 0' }} />
        {/* Faculty grid */}
        <main>
          {loading && <div style={{ fontSize: 22, color: 'var(--ucsb-navy)', textAlign: 'center' }}>Loading...</div>}
          {error && <div style={{ color: 'red', fontSize: 18, textAlign: 'center' }}>{error}</div>}
          {!loading && !error && (
            <>
              <div style={{ 
                fontSize: 18, 
                color: 'var(--ucsb-navy)', 
                marginBottom: '2rem',
                textAlign: 'left',
                fontWeight: 500
              }}>
                Found {faculty.length} faculty member{faculty.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
          {!loading && !error && faculty.length > 0 && (
            <div
              className="faculty-grid"
              style={{
                display: 'grid',
                gap: '2.5rem',
                gridTemplateColumns: 'repeat(4, 1fr)',
                justifyItems: 'center',
              }}
            >
              {faculty.map((f) => {
                // Parse PostgreSQL array format: {"item1","item2","item3"} -> ["item1", "item2", "item3"]
                const parseResearchAreas = (researchAreas: string | null): string[] => {
                  if (!researchAreas) return [];
                  
                  // Remove curly braces and split by comma, then trim whitespace
                  return researchAreas
                    .replace(/[{}]/g, '') // Remove curly braces
                    .split(',') // Split by comma
                    .map(area => area.trim()) // Trim whitespace from each item
                    .filter(area => area.length > 0); // Remove empty strings
                };
                
                const cleanKeywords = parseResearchAreas(f.research_areas || null);
                
                // Log missing photos for debugging
                if (!f.photo_url) {
                  console.log(`Faculty member "${f.name}" is missing photo_url`);
                }
                
                return (
                  <FacultyCard key={f.id} faculty={{
                    id: String(f.id),
                    name: f.name,
                    department: f.department,
                    keywords: cleanKeywords,
                    image: f.photo_url || '',
                  }} />
                );
              })}
            </div>
          )}
          
          {!loading && !error && faculty.length === 0 && (
            <div style={{ 
              fontSize: 20, 
              color: 'var(--ucsb-navy)', 
              textAlign: 'center',
              padding: '3rem 0',
              fontStyle: 'italic'
            }}>
              No faculty members found matching your search criteria.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 1200px) {
      .faculty-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 700px) {
      .faculty-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
} 