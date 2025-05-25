const API_BASE_URL = "http://127.0.0.1:8000/api";
const AUTH_HEADER = `Basic ${btoa('ethanortecho:EthanVer2010!')}`;

export interface Category {
  id: string;
  name: string;
  color: string;
}

export const fetchCategories = async (): Promise<Category[]> => {
  console.log("API: fetchCategories called");
  const res = await fetch(`${API_BASE_URL}/category-list/?username=testuser`, {
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
  const res = await fetch(`${API_BASE_URL}/category-list/?username=testuser`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
    body: JSON.stringify({ name, color }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to create category');
  }
  
  const data = await res.json();
  console.log("API: createCategory data:", data);
  return data;
};

export const updateCategory = async (id: string, name: string, color: string): Promise<Category> => {
  console.log("API: updateCategory called with", id, name, color);
  const res = await fetch(`${API_BASE_URL}/categories/${id}/?username=testuser`, {
    method: "PUT",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
    body: JSON.stringify({ name, color }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update category');
  }
  
  const data = await res.json();
  console.log("API: updateCategory data:", data);
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  console.log("API: deleteCategory called with", id);
  const res = await fetch(`${API_BASE_URL}/categories/${id}/?username=testuser`, {
    method: "DELETE",
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete category');
  }
  
  console.log("API: deleteCategory successful");
};

export const createStudySession = async (startTime: Date) => {
    console.log("API: createStudySession called with", startTime);
    const res = await fetch(`${API_BASE_URL}/create-session/`, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ start_time: startTime }),
    });
    console.log("API: createStudySession response status:", res.status);
    const data = await res.json();
    console.log("API: createStudySession data:", data);
    return data;
  };
  
  export const endStudySession = async (sessionId: string, endTime: Date) => {
    console.log("API: endStudySession called with", sessionId, endTime);
    const res = await fetch(`${API_BASE_URL}/end-session/${sessionId}/`, {
      method: "PUT",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ 
        end_time: endTime,
        status: "completed"
      }),
    });
    const data = await res.json();
    return data;
  };
  
  export const createCategoryBlock = async (sessionId: string, categoryId: string, startTime: Date) => {
    console.log("API: createCategoryBlock called with", categoryId, );
    const res = await fetch(`${API_BASE_URL}/create-category-block/`, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ study_session: sessionId, category: categoryId, start_time: startTime }),
    });
    console.log("API: createCategoryBlock body:", JSON.stringify({ study_session: sessionId, category: categoryId, start_time: startTime }));
    console.log("API: createCategoryBlock response status:", res.status);
    const data = await res.json();
    return data;
  };
  
  export const endCategoryBlock = async (categoryBlockId: string, endTime: Date) => {
    console.log("API: endCategoryBlock called with", categoryBlockId, endTime);
    const res = await fetch(`${API_BASE_URL}/end-category-block/${categoryBlockId}/`, {
      method: "PUT",
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({ end_time: endTime }),
    });
    const data = await res.json();
    return data;
  };