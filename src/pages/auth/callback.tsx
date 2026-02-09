import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL hash (for implicit flow) or query params
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash || window.location.search);
        
        const accessToken = params.get('access_token');
        const error = params.get('error');
        const state = params.get('state');

        if (error) {
          setError(`Authentication failed: ${error}`);
          setLoading(false);
          return;
        }

        if (!accessToken) {
          setError('No access token received');
          setLoading(false);
          return;
        }

        // Decode state to get redirect info
        let redirectUrl = '/';
        let facultyId: string | null = null;
        
        if (state) {
          try {
            const stateData = JSON.parse(atob(state));
            redirectUrl = stateData.redirectUrl || '/';
            facultyId = stateData.facultyId || null;
          } catch (e) {
            console.error('Failed to decode state:', e);
          }
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          setError('Failed to fetch user information');
          setLoading(false);
          return;
        }

        const userInfo = await userInfoResponse.json();

        // Store user info in localStorage (since we can't use httpOnly cookies with static export)
        localStorage.setItem('user_email', userInfo.email);
        localStorage.setItem('user_name', userInfo.name);
        localStorage.setItem('access_token', accessToken);

        // Redirect to the appropriate page
        if (facultyId) {
          router.push(`/faculty/${facultyId}/edit`);
        } else {
          router.push(redirectUrl);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during authentication');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: 'var(--ucsb-navy)', marginBottom: '1rem' }}>
            Completing authentication...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ucsb-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, padding: '2rem' }}>
          <div style={{ fontSize: '24px', color: 'red', marginBottom: '1rem' }}>
            Authentication Error
          </div>
          <p style={{ marginBottom: '2rem', color: 'var(--ucsb-body-text)' }}>
            {error}
          </p>
          <Link href="/" style={{
            color: 'var(--ucsb-navy)',
            textDecoration: 'none',
            fontSize: '18px',
            border: '2px solid var(--ucsb-navy)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
