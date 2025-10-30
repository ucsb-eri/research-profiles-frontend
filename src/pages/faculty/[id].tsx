import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchFacultyById, fetchFacultySummaryTextById, fetchFacultyKeywordsById, fetchFacultyBroadKeywordsById } from '../../lib/api';
import Link from 'next/link';

interface FacultyDetail {
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
  profile_url?: string;
}

export default function FacultyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [broadKeywords, setBroadKeywords] = useState<string[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true);
      fetchFacultyById(parseInt(id))
        .then(setFaculty)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Fetch AI-generated summary, keywords, and broad keywords
  useEffect(() => {
    if (id && typeof id === 'string') {
      const facultyId = parseInt(id);
      
      // Fetch summary
      setSummaryLoading(true);
      fetchFacultySummaryTextById(facultyId)
        .then((data) => {
          if (data && data.summary) {
            setSummary(data.summary);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch summary:', err);
          setSummary(null);
        })
        .finally(() => {
          setSummaryLoading(false);
        });
      
      // Fetch keywords and broad keywords
      setKeywordsLoading(true);
      Promise.all([
        fetchFacultyKeywordsById(facultyId).catch(() => ({ keywords: [] })),
        fetchFacultyBroadKeywordsById(facultyId).catch(() => ({ broad_keywords: [] }))
      ])
        .then(([keywordsData, broadKeywordsData]) => {
          if (keywordsData && keywordsData.keywords) {
            setKeywords(keywordsData.keywords);
          }
          if (broadKeywordsData && broadKeywordsData.broad_keywords) {
            setBroadKeywords(broadKeywordsData.broad_keywords);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch keywords:', err);
        })
        .finally(() => {
          setKeywordsLoading(false);
        });
    }
  }, [id]);

  // Get research areas (now already an array)
  const getResearchAreas = (researchAreas: string[] | null | undefined): string[] => {
    if (!researchAreas || !Array.isArray(researchAreas)) return [];
    return researchAreas.filter(area => area && area.trim().length > 0);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
        <div style={{ textAlign: 'center', padding: '4rem 0', fontSize: '24px', color: 'var(--ucsb-navy)' }}>
          Loading faculty details...
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ fontSize: '24px', color: 'red', marginBottom: '1rem' }}>
            {error || 'Faculty member not found'}
          </div>
          <Link href="/" style={{
            color: 'var(--ucsb-navy)',
            textDecoration: 'none',
            fontSize: '18px',
            border: '2px solid var(--ucsb-navy)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            ← Back to Faculty Search
          </Link>
        </div>
      </div>
    );
  }

  const researchAreas = getResearchAreas(faculty.research_areas);
  
  // Function to get the best quality image URL
  const getBestImageUrl = (photoUrl: string | null | undefined): string => {
    if (!photoUrl) return '/default-faculty.jpg';
    
    // Upgrade small_square to medium_square (8.5x larger!)
    // Department websites display medium_square but API scrapes small_square
    let betterUrl = photoUrl.replace('/styles/small_square/', '/styles/medium_square/');
    
    // Remove query parameters that can reduce quality or add artifacts
    betterUrl = betterUrl.split('?')[0];
    
    return betterUrl;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
      {/* Top navigation bar */}
      <div style={{
        background: 'var(--ucsb-white)',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.75rem 0',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{
            color: 'var(--ucsb-navy)',
            fontWeight: 800,
            fontSize: 32,
            fontFamily: 'Nunito Sans, sans-serif',
            letterSpacing: '-0.5px',
            textDecoration: 'none',
          }}>
            UCSB Research
          </Link>
          <Link href="/" style={{
            color: 'var(--ucsb-navy)',
            textDecoration: 'none',
            fontSize: '18px',
            border: '2px solid var(--ucsb-navy)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
          }}>
            ← Back to Search
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '3rem',
          alignItems: 'start',
        }}>
          {/* Left column - Main photo and bio */}
          <div>
            {/* Faculty photo */}
            <div style={{
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '2rem',
              position: 'relative',
            }}
            >
              {imageLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'var(--ucsb-navy)',
                  fontSize: '18px',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  zIndex: 10,
                }}>
                  Loading image...
                </div>
              )}
              {faculty.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getBestImageUrl(faculty.photo_url)}
                  alt={faculty.name}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    transition: 'transform 0.3s ease',
                    opacity: imageLoading ? 0 : 1,
                  }}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    setImageError(true);
                    setImageLoading(false);
                    // Hide image and show placeholder on error
                    e.currentTarget.style.display = 'none';
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                  onMouseEnter={(e) => {
                    if (!imageLoading && !imageError) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!imageLoading && !imageError) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                />
              ) : null}
              
              {/* Placeholder for missing images */}
              <div
                style={{
                  display: faculty.photo_url ? 'none' : 'flex',
                  width: '100%',
                  height: '400px',
                  background: 'linear-gradient(135deg, var(--ucsb-aqua) 0%, var(--ucsb-navy) 100%)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '120px',
                  fontWeight: 'bold',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {faculty.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            </div>

            {/* Research Specialties */}
            {(faculty.specialization || researchAreas.length > 0) && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--ucsb-navy)',
                  marginBottom: '1rem',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}>
                  Research Specialties
                </h2>
                
                {/* Detailed specialization text */}
                {faculty.specialization && (
                  <div style={{
                    fontSize: '18px',
                    lineHeight: 1.6,
                    color: 'var(--ucsb-body-text)',
                    marginBottom: researchAreas.length > 0 ? '1.5rem' : '0',
                    fontFamily: 'Nunito Sans, sans-serif',
                    padding: '1rem',
                    background: '#f8f9ff',
                    borderRadius: '8px',
                    border: '1px solid #e1e5e9',
                  }}>
                    {faculty.specialization}
                  </div>
                )}
                
                {/* Research areas as tags */}
                {researchAreas.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--ucsb-navy)',
                      marginBottom: '1rem',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}>
                      Key Research Areas
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      {researchAreas.map((area, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'var(--ucsb-aqua)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: 'Nunito Sans, sans-serif',
                            transition: 'transform 0.2s ease',
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI-Generated Research Summary */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 800,
                color: 'var(--ucsb-navy)',
                marginBottom: '1rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                AI-Generated Research Summary
              </h2>
              
              {summaryLoading && (
                <div style={{
                  fontSize: '18px',
                  lineHeight: 1.8,
                  color: 'var(--ucsb-body-text)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  padding: '1.5rem',
                  background: '#f8f9ff',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9',
                  fontStyle: 'italic',
                }}>
                  Loading AI-generated summary...
                </div>
              )}
              
              {!summaryLoading && summary && (
                <div style={{
                  fontSize: '18px',
                  lineHeight: 1.8,
                  color: 'var(--ucsb-body-text)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                  borderRadius: '8px',
                  border: '2px solid var(--ucsb-aqua)',
                  boxShadow: '0 2px 8px rgba(0, 54, 96, 0.08)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e1e5e9',
                  }}>
                    <span style={{
                      fontSize: '24px',
                    }}>🤖</span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--ucsb-aqua)',
                    }}>
                      AI-Generated Content
                    </span>
                  </div>
                  {summary}
                </div>
              )}
              
              {!summaryLoading && !summary && (
                <div style={{
                  fontSize: '18px',
                  lineHeight: 1.6,
                  color: '#999',
                  fontFamily: 'Nunito Sans, sans-serif',
                  padding: '1.5rem',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}>
                  No AI-generated summary available for this faculty member yet.
                </div>
              )}
            </div>

            {/* AI-Generated Keywords */}
            {(broadKeywords.length > 0 || keywords.length > 0) && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--ucsb-navy)',
                  marginBottom: '1rem',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}>
                  AI-Generated Keywords
                </h2>
                
                {/* Broad Keywords */}
                {broadKeywords.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--ucsb-navy)',
                      marginBottom: '0.75rem',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}>
                      Broad Research Areas
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      {broadKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'var(--ucsb-aqua)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: 'Nunito Sans, sans-serif',
                            transition: 'transform 0.2s ease',
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Detailed Keywords */}
                {keywords.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--ucsb-navy)',
                      marginBottom: '0.75rem',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}>
                      Specific Research Keywords
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                    }}>
                      {keywords.map((keyword, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#e8f4f8',
                            color: 'var(--ucsb-navy)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Nunito Sans, sans-serif',
                            border: '1px solid var(--ucsb-aqua)',
                            transition: 'transform 0.2s ease, background 0.2s ease',
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.background = '#d0e8f0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = '#e8f4f8';
                          }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column - Faculty info and links */}
          <div style={{
            background: '#f8f9fa',
            padding: '2rem',
            borderRadius: '12px',
            position: 'sticky',
            top: '2rem',
          }}>
            {/* Faculty name and title */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--ucsb-navy)',
                marginBottom: '0.5rem',
                fontFamily: 'Nunito Sans, sans-serif',
                lineHeight: 1.2,
              }}>
                {faculty.name}
              </h1>
              {faculty.title && (
                <div style={{
                  fontSize: '20px',
                  color: 'var(--ucsb-aqua)',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}>
                  {faculty.title}
                </div>
              )}
              <div style={{
                fontSize: '18px',
                color: 'var(--ucsb-navy)',
                fontWeight: 600,
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                {faculty.department}
              </div>
            </div>

            {/* Research Specialties Summary */}
            {(faculty.specialization || researchAreas.length > 0) && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--ucsb-navy)',
                  marginBottom: '1rem',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}>
                  Research Specialties
                </h3>
                
                {/* Brief specialization preview */}
                {faculty.specialization && (
                  <div style={{
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: 'var(--ucsb-body-text)',
                    marginBottom: researchAreas.length > 0 ? '1rem' : '0',
                    fontFamily: 'Nunito Sans, sans-serif',
                    fontStyle: 'italic',
                  }}>
                    {faculty.specialization.length > 120 
                      ? `${faculty.specialization.substring(0, 120)}...` 
                      : faculty.specialization
                    }
                  </div>
                )}
                
                {/* Top research areas */}
                {researchAreas.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                  }}>
                    {researchAreas.slice(0, 4).map((area, index) => (
                      <span
                        key={index}
                        style={{
                          background: 'var(--ucsb-aqua)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          fontFamily: 'Nunito Sans, sans-serif',
                        }}
                      >
                        {area}
                      </span>
                    ))}
                    {researchAreas.length > 4 && (
                      <span style={{
                        color: 'var(--ucsb-aqua)',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'Nunito Sans, sans-serif',
                        alignSelf: 'center',
                      }}>
                        +{researchAreas.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contact information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--ucsb-navy)',
                marginBottom: '1rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                Contact Information
              </h3>
              {faculty.email && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--ucsb-navy)' }}>Email:</strong>
                  <a
                    href={`mailto:${faculty.email}`}
                    style={{
                      color: 'var(--ucsb-aqua)',
                      textDecoration: 'none',
                      marginLeft: '0.5rem',
                    }}
                  >
                    {faculty.email}
                  </a>
                </div>
              )}
              {faculty.phone && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--ucsb-navy)' }}>Phone:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>{faculty.phone}</span>
                </div>
              )}
              {faculty.office && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--ucsb-navy)' }}>Office:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>{faculty.office}</span>
                </div>
              )}
            </div>

            {/* Links */}
            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--ucsb-navy)',
                marginBottom: '1rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {faculty.website && (
                  <a
                    href={faculty.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--ucsb-aqua)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--ucsb-aqua)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                  >
                    Faculty Website →
                  </a>
                )}
                {faculty.profile_url && (
                  <a
                    href={faculty.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--ucsb-aqua)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--ucsb-aqua)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                  >
                    UCSB Profile →
                  </a>
                )}
                <a
                  href={`https://www.ucsb.edu/directory/search?q=${encodeURIComponent(faculty.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--ucsb-aqua)',
                    textDecoration: 'none',
                    fontSize: '16px',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--ucsb-aqua)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                >
                  Search UCSB Directory →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
