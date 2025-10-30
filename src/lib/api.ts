const API_BASE = 'https://api.research-profiles.grit.ucsb.edu/api/faculty'; // Your backend URL
const API_SUMMARY_BASE = 'https://api.research-profiles.grit.ucsb.edu/api/faculty-summary'; // Note: singular "summary"

export async function fetchFaculty(params: { department?: string; topic?: string; name?: string } = {}) {
  try {
    // Count how many parameters we have
    const paramCount = Object.values(params).filter(val => val && val.trim()).length;
    
    // If we have multiple parameters, try to use the most specific endpoint
    if (paramCount >= 2) {
      // If we have all three: department + topic + name (backend dept-topic is broken, use client-side)
      if (params.department && params.topic && params.name) {
        console.log('Searching by dept+topic+name (client-side filter)');
        const url = new URL(`${API_BASE}/department`);
        url.searchParams.append('department', params.department);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const results = await res.json();
        
        // Filter by name and topic on the client side
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredResults = results.filter((faculty: any) => {
          const nameMatch = faculty.name.toLowerCase().includes(params.name!.toLowerCase());
          const topicMatch = (
            (faculty.research_areas && faculty.research_areas.toLowerCase().includes(params.topic!.toLowerCase())) ||
            (faculty.specialization && faculty.specialization.toLowerCase().includes(params.topic!.toLowerCase())) ||
            (faculty.title && faculty.title.toLowerCase().includes(params.topic!.toLowerCase()))
          );
          return nameMatch && topicMatch;
        });
        return filteredResults;
      }
      
      // If we have both department and topic (backend dept-topic is broken, use client-side)
      if (params.department && params.topic) {
        console.log('Searching by dept+topic (client-side filter)');
        const url = new URL(`${API_BASE}/department`);
        url.searchParams.append('department', params.department);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const results = await res.json();
        
        // Filter by topic on the client side
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredResults = results.filter((faculty: any) => {
          const topicMatch = (
            (faculty.research_areas && faculty.research_areas.toLowerCase().includes(params.topic!.toLowerCase())) ||
            (faculty.specialization && faculty.specialization.toLowerCase().includes(params.topic!.toLowerCase())) ||
            (faculty.title && faculty.title.toLowerCase().includes(params.topic!.toLowerCase()))
          );
          return topicMatch;
        });
        return filteredResults;
      }
      
      // If we have name and department, try department first then filter by name
      if (params.name && params.department) {
        const url = new URL(`${API_BASE}/department`);
        url.searchParams.append('department', params.department);
        console.log('Searching with department endpoint for name+dept:', url.toString());
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const results = await res.json();
        
        // Filter by name on the client side
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredResults = results.filter((faculty: any) => 
          faculty.name.toLowerCase().includes(params.name!.toLowerCase())
        );
        return filteredResults;
      }
      
      // If we have name and topic, filter client-side (backend topic endpoint is broken)
      if (params.name && params.topic) {
        console.log('Searching by name+topic (client-side filter)');
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const allFaculty = await res.json();
        
        // Filter by both name and topic on the client side
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredResults = allFaculty.filter((faculty: any) => {
          const nameMatch = faculty.name.toLowerCase().includes(params.name!.toLowerCase());
          const topicMatch = (
            (faculty.research_areas && faculty.research_areas.toLowerCase().includes(params.topic!.toLowerCase())) ||
            (faculty.specialization && faculty.specialization.toLowerCase().includes(params.topic!.toLowerCase())) ||
            (faculty.title && faculty.title.toLowerCase().includes(params.topic!.toLowerCase()))
          );
          return nameMatch && topicMatch;
        });
        return filteredResults;
      }
    }
    
    // Single parameter searches
    if (params.department && !params.topic && !params.name) {
      const url = new URL(`${API_BASE}/department`);
      url.searchParams.append('department', params.department);
      console.log('Searching with department endpoint:', url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    }
    
    if (params.topic && !params.department && !params.name) {
      // Try keyword-based search first (uses faculty-summary endpoint)
      console.log('Searching by topic/keyword:', params.topic);
      try {
        const keywordResults = await searchFacultyByKeywordWithDetails(params.topic);
        if (keywordResults.length > 0) {
          console.log(`Found ${keywordResults.length} results via keyword search`);
          return keywordResults;
        }
      } catch (keywordError) {
        console.warn('Keyword search failed, falling back to client-side filter:', keywordError);
      }
      
      // Fallback: client-side filtering if keyword search fails
      console.log('Using client-side topic filter');
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const allFaculty = await res.json();
      
      // Filter by topic on client side
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredResults = allFaculty.filter((faculty: any) => {
        const searchTerm = params.topic!.toLowerCase();
        // Search in research_areas, specialization, and title
        return (
          (faculty.research_areas && faculty.research_areas.toLowerCase().includes(searchTerm)) ||
          (faculty.specialization && faculty.specialization.toLowerCase().includes(searchTerm)) ||
          (faculty.title && faculty.title.toLowerCase().includes(searchTerm))
        );
      });
      return filteredResults;
    }
    
    if (params.name && !params.department && !params.topic) {
      const url = new URL(`${API_BASE}/name`);
      url.searchParams.append('name', params.name);
      console.log('Searching with name endpoint:', url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    }
    
    // Default: get all faculty
    console.log('Fetching all faculty from:', API_BASE);
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error('API request failed: Unknown error');
  }
}

export async function fetchFacultyById(id: number) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Faculty not found');
  return res.json();
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
    const res = await fetch(`https://api.research-profiles.grit.ucsb.edu/api/faculty-links/${id}`);
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
