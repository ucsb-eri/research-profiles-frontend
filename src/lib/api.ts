// API Configuration
// The backend base URL is read from NEXT_PUBLIC_API_BASE_URL. Next.js loads this
// automatically per environment:
//   - `next dev`              -> .env.development (http://localhost:3001)
//   - `next build` / `start`  -> .env.production  (https://api.research-profiles.grit.ucsb.edu)
// Override locally without touching committed files by adding .env.local.
// The fallback below keeps things working (prod) even if no env file is present.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.research-profiles.grit.ucsb.edu';

const API_BASE = `${API_BASE_URL}/api/faculty`;
const API_SUMMARY_BASE = `${API_BASE_URL}/api/faculty-summaries`;

// Unified fuzzy, typo-tolerant search. Hits the backend's pg_trgm-powered
// /api/faculty/search endpoint, which ranks matches across name, topics,
// research areas, department, summaries, and keywords. Returns [] on no match.
export async function searchFaculty(
  query: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}
) {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.append('q', query);
  url.searchParams.append('limit', String(limit));
  url.searchParams.append('offset', String(offset));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json(); // results already sorted by relevance (rank desc)
}

export async function fetchFaculty(params: { department?: string; topic?: string; name?: string } = {}) {
  try {
    // Combine the free-text fields (name + topic) into a single fuzzy query.
    // The department dropdown is treated as an exact, post-search filter.
    const query = [params.name, params.topic]
      .map(v => v?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    // No free-text query: department-only filter, or all faculty.
    if (!query) {
      if (params.department && params.department.trim()) {
        const url = new URL(`${API_BASE}/department`);
        url.searchParams.append('department', params.department.trim());
        console.log('Filtering by department:', url.toString());
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      }
      console.log('Fetching all faculty from:', API_BASE);
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    }

    // Free-text query: use the unified fuzzy search endpoint.
    console.log('Fuzzy search for:', query);
    let results = await searchFaculty(query);

    // If a department was explicitly chosen, narrow results to it (exact filter).
    if (params.department && params.department.trim()) {
      const dept = params.department.trim().toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results = results.filter((f: any) => (f.department || '').toLowerCase() === dept);
    }
    return results;
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error('API request failed: Unknown error');
  }
}

export async function fetchFacultyById(id: number) {
  // Add cache-busting to ensure we get fresh data after updates
  const cacheBuster = `?t=${Date.now()}`;
  const res = await fetch(`${API_BASE}/${id}${cacheBuster}`, {
    cache: 'no-store', // Prevent browser caching
  });
  if (!res.ok) throw new Error('Faculty not found');
  const data = await res.json();
  
  // Ensure research_areas is always an array
  if (data.research_areas) {
    if (typeof data.research_areas === 'string') {
      // Check if it's PostgreSQL array format: {value1,value2}
      if (data.research_areas.startsWith('{') && data.research_areas.endsWith('}')) {
        // Parse PostgreSQL array format
        const arrayContent = data.research_areas.slice(1, -1); // Remove { and }
        data.research_areas = arrayContent
          .split(',')
          .map((area: string) => {
            // Remove all quotes (both single and double, from start and end)
            let cleaned = area.trim();
            // Remove surrounding quotes
            cleaned = cleaned.replace(/^["']|["']$/g, '');
            return cleaned;
          })
          .filter((area: string) => area.length > 0);
      } else {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(data.research_areas);
          data.research_areas = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If not JSON, try splitting by comma or newline
          data.research_areas = data.research_areas
            .split(/[,\n]/)
            .map((area: string) => area.trim())
            .filter((area: string) => area.length > 0);
        }
      }
    } else if (!Array.isArray(data.research_areas)) {
      // If it's not a string and not an array, make it an empty array
      data.research_areas = [];
    }
  } else {
    data.research_areas = [];
  }
  
  // Log research_areas format for debugging
  console.log(`[FETCH] Faculty ID ${id} - research_areas type:`, typeof data.research_areas, 'value:', data.research_areas);
  return data;
}

// Update faculty by ID
export async function updateFaculty(
  id: number,
  updates: {
    specialization?: string;
    research_areas?: string[];
    phone?: string;
    office?: string;
    website?: string;
    email?: string;
    profile_url?: string;
  },
  userEmail: string
) {
  const url = `${API_BASE}/${id}`;
  const requestBody = JSON.stringify(updates);
  
  console.group('🔵 [UPDATE FACULTY] Request Details');
  console.log('URL:', url);
  console.log('Method: PUT');
  console.log('Faculty ID:', id);
  console.log('User Email:', userEmail);
  console.log('Updates:', updates);
  console.log('Request Body:', requestBody);
  console.log('API_BASE:', API_BASE);
  console.groupEnd();
  
  try {
    const fetchOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
      },
      body: requestBody,
    };
    
    console.group('🟢 [UPDATE FACULTY] Fetch Options');
    console.log('Options:', JSON.stringify(fetchOptions, null, 2));
    console.groupEnd();
    
    const startTime = Date.now();
    const res = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;
    
    console.group('🟡 [UPDATE FACULTY] Response Details');
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    console.log('Duration:', `${duration}ms`);
    console.log('OK:', res.ok);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    console.log('URL (final):', res.url);
    console.log('Redirected:', res.redirected);
    console.log('Type:', res.type);
    console.groupEnd();
    
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      let errorDetails: { error?: string; message?: string } | null = null;
      let responseText = '';
      
      try {
        responseText = await res.text();
        console.group('🔴 [UPDATE FACULTY] Error Response');
        console.log('Response Text (raw):', responseText);
        console.log('Response Text Length:', responseText.length);
        console.log('Content-Type:', res.headers.get('content-type'));
        console.groupEnd();
        
        if (responseText) {
          try {
            errorDetails = JSON.parse(responseText) as { error?: string; message?: string };
            console.log('Parsed Error JSON:', errorDetails);
            errorMessage = errorDetails.error || errorDetails.message || errorMessage;
          } catch {
            console.warn('Failed to parse as JSON, using raw text');
            // Check if it's HTML (like the error page we saw)
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
              // Extract text from HTML if possible
              const match = responseText.match(/<pre[^>]*>([^<]+)<\/pre>/i);
              if (match) {
                errorMessage = match[1].trim();
              } else {
                errorMessage = `Server returned HTML error page: ${res.status} ${res.statusText}`;
              }
            } else {
              errorMessage = responseText.trim() || errorMessage;
            }
          }
        }
      } catch (readError) {
        console.error('❌ [UPDATE FACULTY] Failed to read error response:', readError);
      }
      
      console.group('❌ [UPDATE FACULTY] Error Summary');
      console.error('Status:', res.status);
      console.error('Status Text:', res.statusText);
      console.error('Error Message:', errorMessage);
      console.error('Error Details:', errorDetails);
      console.error('Response Text:', responseText.substring(0, 500)); // First 500 chars
      console.groupEnd();
      
      throw new Error(errorMessage);
    }

    const responseData = await res.json();
    console.group('✅ [UPDATE FACULTY] Success');
    console.log('Response Data:', responseData);
    console.groupEnd();
    
    return responseData;
  } catch (error) {
    console.group('💥 [UPDATE FACULTY] Exception');
    console.error('Error Type:', error?.constructor?.name);
    console.error('Error:', error);
    console.error('Error Message:', error instanceof Error ? error.message : String(error));
    console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack');
    console.groupEnd();
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to update faculty: ${String(error)}`);
  }
}

// Get all available departments
export async function fetchAllDepartments() {
  try {
    const res = await fetch(`${API_BASE}/alldepartments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error('Departments API Error:', error);
    throw new Error('Failed to fetch departments');
  }
}

// Get faculty links by ID
export async function fetchFacultyLinks(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/faculty-links/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error('Faculty Links API Error:', error);
    throw new Error('Failed to fetch faculty links');
  }
}

// ============ Faculty Summary API Functions ============

// Get all summary data for a faculty member (summary, keywords, broad_keywords)
export async function fetchFacultySummaryById(id: number) {
  try {
    const res = await fetch(`${API_SUMMARY_BASE}/id/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error('Faculty Summary API Error:', error);
    throw new Error('Failed to fetch faculty summary');
  }
}

// Get just the summary text for a faculty member
export async function fetchFacultySummaryTextById(id: number) {
  try {
    const res = await fetch(`${API_SUMMARY_BASE}/id/${id}/summary`);
    if (!res.ok) {
      if (res.status === 404) {
        // No summary available for this faculty member
        return { summary: null };
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Faculty Summary Text API Error:', error);
    return { summary: null };
  }
}

// Get keywords for a faculty member
export async function fetchFacultyKeywordsById(id: number) {
  try {
    const res = await fetch(`${API_SUMMARY_BASE}/id/${id}/keywords`);
    if (!res.ok) {
      if (res.status === 404) {
        // No keywords available for this faculty member
        return { keywords: [] };
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Faculty Keywords API Error:', error);
    return { keywords: [] };
  }
}

// Get broad keywords for a faculty member
export async function fetchFacultyBroadKeywordsById(id: number) {
  try {
    const res = await fetch(`${API_SUMMARY_BASE}/id/${id}/broad_keywords`);
    if (!res.ok) {
      if (res.status === 404) {
        // No broad keywords available for this faculty member
        return { broad_keywords: [] };
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Faculty Broad Keywords API Error:', error);
    return { broad_keywords: [] };
  }
}

// Get broad keywords for a department
export async function fetchBroadKeywordsByDepartment(department: string) {
  try {
    const url = new URL(`${API_SUMMARY_BASE}/broad_keywords/department`);
    url.searchParams.append('department', department);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error('Department Broad Keywords API Error:', error);
    throw new Error('Failed to fetch department broad keywords');
  }
}

// Search faculty by keyword - returns array of faculty IDs
export async function searchFacultyByKeyword(keyword: string) {
  try {
    const res = await fetch(`${API_SUMMARY_BASE}/keyword/${encodeURIComponent(keyword)}/getId`);
    if (!res.ok) {
      if (res.status === 404) {
        return []; // No faculty found for this keyword
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Keyword Search API Error:', error);
    throw new Error('Failed to search by keyword');
  }
}

// Enhanced search: Search by keyword and return full faculty details
export async function searchFacultyByKeywordWithDetails(keyword: string) {
  try {
    // Get faculty IDs that match the keyword (API returns array of numbers)
    const facultyIds: number[] = await searchFacultyByKeyword(keyword);
    
    if (facultyIds.length === 0) {
      return [];
    }
    
    // Deduplicate faculty IDs (in case of duplicates)
    const uniqueIds = Array.from(new Set(facultyIds));
    
    // Fetch full details for each unique faculty member
    const facultyPromises = uniqueIds.map(id => 
      fetchFacultyById(id).catch(err => {
        console.error(`Failed to fetch faculty ${id}:`, err);
        return null;
      })
    );
    
    const facultyDetails = await Promise.all(facultyPromises);
    // Filter out any null results from failed fetches
    return facultyDetails.filter(f => f !== null);
  } catch (error) {
    console.error('Keyword Search with Details Error:', error);
    return [];
  }
} 
