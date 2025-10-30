import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchFacultySummaryTextById } from '../lib/api';

export type Faculty = {
  id: string;
  name: string;
  department: string | string[];
  keywords: string[];
  image: string;
  summary?: string; // Optional summary text
};

export default function FacultyCard({ faculty, showSummary = false }: { 
  faculty: Faculty;
  showSummary?: boolean;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<string | null>(faculty.summary || null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // Allow department to be string or array for future flexibility
  const departments = Array.isArray(faculty.department)
    ? faculty.department
    : [faculty.department];

  // Fetch summary if showSummary is true
  useEffect(() => {
    if (showSummary) {
      const facultyId = parseInt(faculty.id);
      setLoadingSummary(true);
      fetchFacultySummaryTextById(facultyId)
        .then(data => {
          if (data && data.summary) {
            setSummary(data.summary);
          }
        })
        .catch(error => {
          console.error('Failed to fetch summary:', error);
          setSummary(null);
        })
        .finally(() => {
          setLoadingSummary(false);
        });
    }
  }, [showSummary, faculty.id]);

  const handleCardClick = () => {
    router.push(`/faculty/${faculty.id}`);
  };

  // Truncate summary to ~150 characters
  const truncateSummary = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  // Get higher quality image by upgrading to medium_square
  const getHighQualityImage = (url: string): string => {
    if (!url) return url;
    
    // Upgrade small_square to medium_square (8.5x larger!)
    // Department websites display medium_square but API scrapes small_square
    let betterUrl = url.replace('/styles/small_square/', '/styles/medium_square/');
    
    // Remove query parameters that can reduce quality or add artifacts
    betterUrl = betterUrl.split('?')[0];
    
    return betterUrl;
  };

  return (
    <div 
      onClick={handleCardClick}
      style={{
        background: 'var(--ucsb-white)',
        borderRadius: '12px',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: 340,
        minWidth: 260,
        overflow: 'hidden',
        margin: '0 auto',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {faculty.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getHighQualityImage(faculty.image)}
          alt={faculty.name}
          style={{
            width: '100%',
            height: 280,
            objectFit: 'cover',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            transition: 'transform 0.3s ease',
          }}
          onError={(e) => {
            // Hide the image on error and show placeholder instead
            e.currentTarget.style.display = 'none';
            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
            if (placeholder) placeholder.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Placeholder for missing images */}
      <div
        style={{
          display: faculty.image ? 'none' : 'flex',
          width: '100%',
          height: 280,
          background: 'linear-gradient(135deg, var(--ucsb-aqua) 0%, var(--ucsb-navy) 100%)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '48px',
          fontWeight: 'bold',
          fontFamily: 'Nunito Sans, sans-serif',
        }}
      >
        {faculty.name.split(' ').map(n => n[0]).join('').toUpperCase()}
      </div>
      <div style={{ padding: '1.2rem 1.2rem 1.2rem 1.2rem', width: '100%' }}>
        <div style={{
          fontFamily: 'Nunito Sans, sans-serif',
          fontWeight: 800,
          fontSize: 26,
          color: 'var(--ucsb-navy)',
          marginBottom: 8,
          textAlign: 'left',
        }}>
          {faculty.name}
        </div>
        <div style={{
          fontFamily: 'Nunito Sans, sans-serif',
          fontWeight: 600,
          fontSize: 19,
          color: 'var(--ucsb-aqua)',
          marginBottom: 8,
          textAlign: 'left',
          lineHeight: 1.3,
        }}>
          {departments.map((dept, i) => (
            <div key={i}>{dept}</div>
          ))}
        </div>
        {/* Display summary if enabled */}
        {showSummary && (
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--ucsb-light-gray)',
          }}>
            {loadingSummary && (
              <div style={{
                color: 'var(--ucsb-body-text)',
                fontSize: 15,
                fontStyle: 'italic',
              }}>
                Loading summary...
              </div>
            )}
            {!loadingSummary && summary && (
              <div style={{
                color: 'var(--ucsb-body-text)',
                fontSize: 15,
                lineHeight: 1.6,
                textAlign: 'left',
              }}>
                {truncateSummary(summary, 180)}
              </div>
            )}
            {!loadingSummary && !summary && showSummary && (
              <div style={{
                color: 'var(--ucsb-body-text)',
                fontSize: 15,
                fontStyle: 'italic',
                opacity: 0.7,
              }}>
                No summary available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 