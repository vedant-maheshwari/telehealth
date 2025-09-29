const API_CONFIG = {
  getApiBaseUrl: () => {
    if (window.location.hostname.includes('azurewebsites.net')) {
      return "https://telehealth-webapp-123.azurewebsites.net"; // Update with your deployed backend
    }
    return "http://localhost:8000";
  },

  getApiBaseUrlWithouthttp: () => {
    if (window.location.hostname.includes('azurewebsites.net')) {
      return "telehealth-webapp-123.azurewebsites.net"; // Update with your deployed backend
    }
    return "localhost:8000";
  },
  
  endpoints: {
    USER_ME: '/user/me',
    CHATS_CREATE: '/chats/create',
    CHATS_MY: '/chats/my',
    ADD_VITAL: '/add_vital',
    GET_VITALS: '/get_vital',
    FAMILY_VITALS: '/family/patient-records'
  }
};

window.API_CONFIG = API_CONFIG;
