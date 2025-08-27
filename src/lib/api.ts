const API_BASE = 'http://localhost:3000/api/faculty'; // Your backend URL

export async function fetchFaculty(params: { department?: string; topic?: string; name?: string } = {}) {
  try {
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
    
    // If we only have department, use the department endpoint
    if (params.department && !params.topic && !params.name) {
      const url = new URL(`${API_BASE}/department`);
      url.searchParams.append('department', params.department);
      console.log('Searching with department endpoint:', url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    }
    
    // If we only have topic, use the topic endpoint
    if (params.topic && !params.department && !params.name) {
      const url = new URL(`${API_BASE}/topic`);
      url.searchParams.append('topic', params.topic);
      console.log('Searching with topic endpoint:', url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    }
    
    // If we only have name, use the name endpoint
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