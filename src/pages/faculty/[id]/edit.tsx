import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchFacultyById, updateFaculty } from '../../../lib/api';
import { getUserEmail } from '../../../lib/auth';
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
  research_areas?: string[];
  department: string;
  profile_url?: string;
}

export default function FacultyEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    specialization: '',
    research_areas: '',
    email: '',
    office: '',
    website: '',
    profile_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Check authentication
    const email = getUserEmail();
    setUserEmail(email);
    
    if (!email) {
      setError('Please sign in to edit your profile');
      setLoading(false);
      return;
    }
    
    // Fetch faculty data
    if (id && typeof id === 'string') {
      fetchFacultyById(parseInt(id))
        .then((facultyData) => {
          setFaculty(facultyData);
          // Check if user email matches faculty email
          // Allow brian_kim@ucsb.edu to edit any profile for testing
          const isTestEmail = email.toLowerCase() === 'brian_kim@ucsb.edu';
          const emailMatches = facultyData.email && email.toLowerCase() === facultyData.email.toLowerCase();
          
          if (isTestEmail || emailMatches) {
            setAuthorized(true);
            // Initialize form data
            setFormData({
              specialization: facultyData.specialization || '',
              research_areas: Array.isArray(facultyData.research_areas) 
                ? facultyData.research_areas.join('\n') 
                : (facultyData.research_areas || ''),
              email: facultyData.email || '',
              office: facultyData.office || '',
              website: facultyData.website || '',
              profile_url: facultyData.profile_url || '',
            });
          } else {
            setError('You are not authorized to edit this profile');
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
        <div style={{ textAlign: 'center', padding: '4rem 0', fontSize: '24px', color: 'var(--ucsb-navy)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: 'red', marginBottom: '1rem' }}>
            {error || 'Faculty member not found'}
          </div>
          <Link href={`/faculty/${id}`} style={{
            color: 'var(--ucsb-navy)',
            textDecoration: 'none',
            fontSize: '18px',
            border: '2px solid var(--ucsb-navy)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            ← Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: 'red', marginBottom: '1rem' }}>
            Unauthorized
          </div>
          <p style={{ marginBottom: '2rem', color: 'var(--ucsb-body-text)' }}>
            You can only edit your own profile. The email you signed in with ({userEmail}) does not match this profile's email ({faculty.email}).
            {userEmail?.toLowerCase() === 'brian_kim@ucsb.edu' && (
              <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--ucsb-aqua)', fontWeight: 600 }}>
                Note: brian_kim@ucsb.edu has test access to edit any profile.
              </span>
            )}
          </p>
          <Link href={`/faculty/${id}`} style={{
            color: 'var(--ucsb-navy)',
            textDecoration: 'none',
            fontSize: '18px',
            border: '2px solid var(--ucsb-navy)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            ← Back to Profile
          </Link>
        </div>
      </div>
    );
  }

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
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            outline: 'none',
          }}>
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

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--ucsb-navy)',
          marginBottom: '2rem',
          fontFamily: 'Nunito Sans, sans-serif',
        }}>
          Edit Profile: {faculty.name}
        </h1>

        {userEmail?.toLowerCase() === 'brian_kim@ucsb.edu' && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{ fontSize: '14px', color: '#856404', margin: 0, fontWeight: 600 }}>
              🧪 TEST MODE: You have admin access to edit any profile
            </p>
          </div>
        )}

        {saveSuccess && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{ fontSize: '14px', color: '#155724', margin: 0, fontWeight: 600 }}>
              ✓ Profile updated successfully!
            </p>
          </div>
        )}

        {saveError && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{ fontSize: '14px', color: '#721c24', margin: 0, fontWeight: 600 }}>
              ✗ Error: {saveError}
            </p>
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!userEmail || !faculty) return;

            setSaving(true);
            setSaveError(null);
            setSaveSuccess(false);

            try {
              // Convert research_areas from newline-separated string to array
              const researchAreasArray = formData.research_areas
                .split('\n')
                .map(area => area.trim())
                .filter(area => area.length > 0);

              const updates: {
                specialization?: string;
                research_areas?: string[];
                email?: string;
                office?: string;
                website?: string;
                profile_url?: string;
              } = {};

              if (formData.specialization.trim()) {
                updates.specialization = formData.specialization.trim();
              }
              if (researchAreasArray.length > 0) {
                updates.research_areas = researchAreasArray;
              }
              if (formData.email.trim()) {
                updates.email = formData.email.trim();
              }
              if (formData.office.trim()) {
                updates.office = formData.office.trim();
              }
              if (formData.website.trim()) {
                updates.website = formData.website.trim();
              }
              if (formData.profile_url.trim()) {
                updates.profile_url = formData.profile_url.trim();
              }

              await updateFaculty(faculty.id, updates, userEmail);
              setSaveSuccess(true);
              
              // Redirect to profile page after 2 seconds
              setTimeout(() => {
                router.push(`/faculty/${faculty.id}`);
              }, 2000);
            } catch (err) {
              setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
            } finally {
              setSaving(false);
            }
          }}
          style={{
            background: '#f8f9fa',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ucsb-navy)',
              marginBottom: '0.5rem',
              fontFamily: 'Nunito Sans, sans-serif',
            }}>
              Specialization
            </label>
            <textarea
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontFamily: 'Nunito Sans, sans-serif',
                resize: 'vertical',
              }}
              placeholder="Enter research specialization..."
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ucsb-navy)',
              marginBottom: '0.5rem',
              fontFamily: 'Nunito Sans, sans-serif',
            }}>
              Research Areas (one per line)
            </label>
            <textarea
              value={formData.research_areas}
              onChange={(e) => setFormData({ ...formData, research_areas: e.target.value })}
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontFamily: 'Nunito Sans, sans-serif',
                resize: 'vertical',
              }}
              placeholder="Enter research areas, one per line..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '1.5rem', paddingRight: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ucsb-navy)',
                marginBottom: '0.5rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                placeholder="e.g., faculty@ucsb.edu"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ucsb-navy)',
                marginBottom: '0.5rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                Office
              </label>
              <input
                type="text"
                value={formData.office}
                onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                placeholder="e.g., Engineering II, Room 1234"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem', paddingRight: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ucsb-navy)',
                marginBottom: '0.5rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ucsb-navy)',
                marginBottom: '0.5rem',
                fontFamily: 'Nunito Sans, sans-serif',
              }}>
                Publications Link
              </label>
              <input
                type="url"
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                placeholder="https://scholar.google.com/..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link
              href={`/faculty/${id}`}
              style={{
                color: 'var(--ucsb-navy)',
                textDecoration: 'none',
                fontSize: '18px',
                border: '2px solid var(--ucsb-navy)',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                display: 'inline-block',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#ccc' : 'var(--ucsb-navy)',
                color: 'white',
                border: 'none',
                fontSize: '18px',
                fontWeight: 700,
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Nunito Sans, sans-serif',
                transition: 'background 0.2s',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
