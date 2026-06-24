import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FacultyCard from '../components/FacultyCard';
import FacultySearchBar from '../components/FacultySearchBar';
import { fetchFacultyPage } from '../lib/api';

// How many faculty to request per page as the user scrolls.
const PAGE_SIZE = 24;

type SearchParams = { department?: string; topic?: string; name?: string; division?: string };

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
  research_areas?: string[]; // Now an array instead of string
  department: string;
  division?: string;
  profile_url?: string;
  rank?: number; // Relevance score (0-1) from the fuzzy search endpoint
}

export default function HomePage() {
  const [faculty, setFaculty] = useState<BackendFaculty[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [paginated, setPaginated] = useState(false);
  const [loading, setLoading] = useState(true);        // first page / new search
  const [loadingMore, setLoadingMore] = useState(false); // subsequent pages
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams>({});

  // Current scroll offset and the params the loaded pages belong to. Kept in
  // refs so loadMore always reads the latest values without re-subscribing.
  const offsetRef = useRef(0);
  const paramsRef = useRef<SearchParams>({});
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // More to load only in server-paginated modes, until we've reached the total.
  const hasMore = paginated && (total === null || faculty.length < total);

  // Load the first page for a set of params (initial load or a new search).
  const loadFirst = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setLastSearchParams(params);
    paramsRef.current = params;
    offsetRef.current = 0;
    try {
      const page = await fetchFacultyPage(params, { limit: PAGE_SIZE, offset: 0 });
      setFaculty(page.data);
      setTotal(page.total);
      setPaginated(page.paginated);
      offsetRef.current = page.data.length;
    } catch (err) {
      console.error('Faculty fetch error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setFaculty([]);
      setTotal(0);
      setPaginated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Append the next page at the current offset.
  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await fetchFacultyPage(paramsRef.current, {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      offsetRef.current += page.data.length;
      // Guard against duplicate keys if a page overlaps a previous one.
      setFaculty((prev) => {
        const seen = new Set(prev.map((f) => f.id));
        return [...prev, ...page.data.filter((f: BackendFaculty) => !seen.has(f.id))];
      });
    } catch (err) {
      console.error('Load more error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore]);

  // Initial load.
  useEffect(() => {
    loadFirst({});
  }, [loadFirst]);

  // Fire loadMore when the sentinel scrolls near the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' } // prefetch before it's fully visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleSearch = (params: SearchParams) => {
    console.log('Search triggered with params:', params);
    loadFirst(params);
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
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* UCSB Brand: Official tab logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', outline: 'none' }}>
            <img
              src="/UCSB_Tab_KO_Navy_RGB (1).png"
              alt="UC Santa Barbara"
              style={{
                height: '40px',
                width: 'auto',
                maxWidth: '100%',
              }}
            />
            <span style={{
              color: 'var(--ucsb-navy)',
              fontWeight: 800,
              fontSize: 24,
              fontFamily: 'Nunito Sans, sans-serif',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
              marginLeft: '1rem',
            }}>
              Research
            </span>
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 2rem' }}>
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
        {/* Divider below search bar - UCSB Brand: Using brand-compliant border color */}
        <hr style={{ border: 'none', borderTop: '2px solid var(--ucsb-border-color, #e5e7eb)', margin: '2.5rem 0 2rem 0' }} />
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
                {total !== null && total !== faculty.length
                  ? `Showing ${faculty.length} of ${total} faculty members`
                  : `Found ${faculty.length} faculty member${faculty.length !== 1 ? 's' : ''}`}
                {Object.values(lastSearchParams).some(val => val && val.trim()) && (
                  <span style={{ fontSize: 16, fontWeight: 400, color: '#666', marginLeft: 8 }}>
                    {Object.entries(lastSearchParams)
                      .filter(([, value]) => value && value.trim())
                      .map(([key, value]) => `${key}: "${value}"`)
                      .join(', ')}
                  </span>
                )}
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
                // Get research areas (now already an array)
                const getResearchAreas = (researchAreas: string[] | null | undefined): string[] => {
                  if (!researchAreas || !Array.isArray(researchAreas)) return [];
                  return researchAreas.filter(area => area && area.trim().length > 0);
                };
                
                const cleanKeywords = getResearchAreas(f.research_areas);
                
                // Log missing photos for debugging
                if (!f.photo_url) {
                  console.log(`Faculty member "${f.name}" is missing photo_url`);
                }
                
                return (
                  <FacultyCard 
                    key={f.id} 
                    faculty={{
                      id: String(f.id),
                      name: f.name,
                      department: f.department,
                      keywords: cleanKeywords,
                      image: f.photo_url || '',
                    }}
                    showSummary={false}  // Don't show summary on search results
                  />
                );
              })}
            </div>
          )}

          {/* Infinite scroll: when this sentinel nears the viewport, load the
              next page. Only rendered while there are more pages to fetch. */}
          {!loading && !error && hasMore && (
            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--ucsb-navy)', fontSize: 18 }}>
              Loading more…
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

      {/* Footer with UCSB wordmark */}
      <footer style={{
        background: 'var(--ucsb-navy)',
        padding: '2rem 0',
        marginTop: '4rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/UC_Santa_Barbara_Wordmark_Navy_RGB (1).png"
            alt="UC Santa Barbara"
            style={{
              height: '35px',
              width: 'auto',
              maxWidth: '100%',
              filter: 'brightness(0) invert(1)', // Make it white for dark background
            }}
          />
        </div>
      </footer>
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