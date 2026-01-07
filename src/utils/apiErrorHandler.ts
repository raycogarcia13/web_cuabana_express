interface ApiError {
  message: string;
  redirect?: string;
  expired?: boolean;
}

export const handleApiError = (error: any): void => {
  if (error?.redirect) {
    // Clear any existing auth data
    localStorage.removeItem('cubana_auth');
    
    // Show user-friendly message
    const message = error.expired 
      ? 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      : error.message || 'Tu sesión ha finalizado. Por favor inicia sesión nuevamente.';
    
    // Show message and redirect
    alert(message);
    window.location.href = error.redirect;
    return;
  }
  
  // Handle other API errors
  if (error?.message) {
    console.error('API Error:', error.message);
    throw error;
  }
};

export const createApiCall = async <T>(
  apiCall: () => Promise<T>
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    handleApiError(error);
    throw error;
  }
};
