import { API_BASE_URL } from '../config/api';

const AUTH_HEADER = `Basic ${btoa('ethanortecho:EthanVer2010!')}`;

export interface Category {
  id: string;
  name: string;
  color: string;
}

export const fetchCategories = async (): Promise<Category[]> => {
  console.log("API: fetchCategories called");
  const res = await fetch(`${API_BASE_URL}/category-list/?username=ethanortecho`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    }
  });
  const data = await res.json();
  console.log("API: fetchCategories data:", data);
  return data;
};

export const createCategory = async (name: string, color: string): Promise<Category> => {
  console.log("API: createCategory called with", name, color);
  const res = await fetch(`${API_BASE_URL}/category-list/?username=ethanortecho`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
    body: JSON.stringify({ name, color }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to create category');
  }
  
  const data = await res.json();
  console.log("API: createCategory data:", data);
  return data;
};

export const updateCategory = async (id: string, name: string, color: string): Promise<Category> => {
  console.log("API: updateCategory called with", id, name, color);
  const res = await fetch(`${API_BASE_URL}/categories/${id}/?username=ethanortecho`, {
    method: "PUT",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
    body: JSON.stringify({ name, color }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to update category');
  }
  
  const data = await res.json();
  console.log("API: updateCategory data:", data);
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  console.log("API: deleteCategory called with", id);
  const res = await fetch(`${API_BASE_URL}/categories/${id}/?username=ethanortecho`, {
    method: "DELETE",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to delete category');
  }
  
  console.log("API: deleteCategory successful");
};

export const fetchBreakCategory = async (): Promise<Category> => {
  console.log("API: fetchBreakCategory called");
  const res = await fetch(`${API_BASE_URL}/break-category/?username=ethanortecho`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to fetch break category');
  }
  
  const data = await res.json();
  console.log("API: fetchBreakCategory data:", data);
  return data;
};

export const createStudySession = async (startTime: Date) => {
    console.log("API: createStudySession called with", startTime);
    
    // Preserve local calendar date by adjusting for timezone offset
    const localStartTime = new Date(startTime.getTime() - (startTime.getTimezoneOffset() * 60000));
    console.log("API: Adjusted start time for timezone:", localStartTime);
    
    const res = await fetch(`${API_BASE_URL}/create-session/`, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ start_time: localStartTime }),
    });
    console.log("API: createStudySession response status:", res.status);
    const data = await res.json();
    console.log("API: createStudySession data:", data);
    return data;
  };
  
  export const endStudySession = async (sessionId: string, endTime: Date) => {
    console.log("API: endStudySession called with", sessionId, endTime);
    
    // Preserve local calendar date by adjusting for timezone offset
    const localEndTime = new Date(endTime.getTime() - (endTime.getTimezoneOffset() * 60000));
    console.log("API: Adjusted end time for timezone:", localEndTime);
    
    const res = await fetch(`${API_BASE_URL}/end-session/${sessionId}/`, {
      method: "PUT",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ 
        end_time: localEndTime,
        status: "completed"
      }),
    });
    const data = await res.json();
    return data;
  };
  
  export const createCategoryBlock = async (sessionId: string, categoryId: string, startTime: Date) => {
    console.log("API: createCategoryBlock called with", categoryId, );
    
    // Preserve local calendar date by adjusting for timezone offset
    const localStartTime = new Date(startTime.getTime() - (startTime.getTimezoneOffset() * 60000));
    console.log("API: Adjusted category block start time for timezone:", localStartTime);
    
    const res = await fetch(`${API_BASE_URL}/create-category-block/`, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ study_session: sessionId, category: categoryId, start_time: localStartTime }),
    });
    console.log("API: createCategoryBlock body:", JSON.stringify({ study_session: sessionId, category: categoryId, start_time: localStartTime }));
    console.log("API: createCategoryBlock response status:", res.status);
    const data = await res.json();
    return data;
  };
  
  export const endCategoryBlock = async (categoryBlockId: string, endTime: Date) => {
    console.log("API: endCategoryBlock called with", categoryBlockId, endTime);
    
    // Preserve local calendar date by adjusting for timezone offset
    const localEndTime = new Date(endTime.getTime() - (endTime.getTimezoneOffset() * 60000));
    console.log("API: Adjusted category block end time for timezone:", localEndTime);
    
    const res = await fetch(`${API_BASE_URL}/end-category-block/${categoryBlockId}/`, {
      method: "PUT",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ end_time: localEndTime }),
    });
    const data = await res.json();
    return data;
  };

export const cancelStudySession = async (sessionId: string) => {
  console.log("API: cancelStudySession called with", sessionId);
  const res = await fetch(`${API_BASE_URL}/cancel-session/${sessionId}/`, {
    method: "PUT",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER
    },
    body: JSON.stringify({}), // Empty body for cancel
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to cancel session');
  }
  
  const data = await res.json();
  console.log("API: cancelStudySession data:", data);
  return data;
};