import React from 'react';
import { useRouter } from 'next/router';

export type Faculty = {
  id: string;
  name: string;
  department: string | string[];
  keywords: string[];
  image: string;
};

export default function FacultyCard({ faculty }: { faculty: Faculty }) {
  const router = useRouter();
  
  // Allow department to be string or array for future flexibility
  const departments = Array.isArray(faculty.department)
    ? faculty.department
    : [faculty.department];

  const handleCardClick = () => {
    router.push(`/faculty/${faculty.id}`);
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
        <img
          src={faculty.image}
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
        <div style={{
          color: 'var(--ucsb-body-text)',
          fontSize: 17,
          fontWeight: 400,
          textAlign: 'left',
          lineHeight: 1.5,
        }}>
          {faculty.keywords.join(', ')}
        </div>
      </div>
    </div>
  );
} 