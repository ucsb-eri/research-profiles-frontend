const API_BASE = 'http://localhost:3000/api/faculty'; // Your backend URL

export async function fetchFaculty(params: { department?: string; topic?: string; name?: string } = {}) {
  try {
    // Count how many parameters we have
    const paramCount = Object.values(params).filter(val => val && val.trim()).length;
    
    // If we have multiple parameters, try to use the most specific endpoint
    if (paramCount >= 2) {
      // If we have both department and topic, use the dept-topic endpoint
      if (params.department && params.topic) {
        const url = new URL(`${API_BASE}/dept-topic`);
        url.searchParams.append('department', params.department);
        url.searchParams.append('topic', params.topic);
        console.log('Searching with dept-topic endpoint:', url.toString());
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
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
        const filteredResults = results.filter((faculty: any) => 
          faculty.name.toLowerCase().includes(params.name!.toLowerCase())
        );
        return filteredResults;
      }
      
      // If we have name and topic, try topic first then filter by name
      if (params.name && params.topic) {
        const url = new URL(`${API_BASE}/topic`);
        url.searchParams.append('topic', params.topic);
        console.log('Searching with topic endpoint for name+topic:', url.toString());
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const results = await res.json();
        
        // Filter by name on the client side
        const filteredResults = results.filter((faculty: any) => 
          faculty.name.toLowerCase().includes(params.name!.toLowerCase())
        );
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
      const url = new URL(`${API_BASE}/topic`);
      url.searchParams.append('topic', params.topic);
      console.log('Searching with topic endpoint:', url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
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

// New function for flexible search with multiple parameters
export async function searchFaculty(params: { 
  department?: string; 
  topic?: string; 
  name?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const url = new URL(`${API_BASE}/search`);
    
    // Add all non-empty parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        url.searchParams.append(key, value.toString().trim());
      }
    });
    
    console.log('Searching with flexible endpoint:', url.toString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (error) {
    console.error('Search API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Search request failed: ${error.message}`);
    }
    throw new Error('Search request failed: Unknown error');
  }
} 