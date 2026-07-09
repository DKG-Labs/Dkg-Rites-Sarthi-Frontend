import { API_ENDPOINTS, getAuthHeaders, handleResponse } from './apiConfig';

export const getUserProfile = async () => {
    try {
        const headers = getAuthHeaders();
        const token = headers['Authorization'] || '';
        
        // Mock profile for hardcoded users to prevent 403 errors
        if (token.includes('mock-token')) {
            const role = token.includes('admin') ? 'Admin' : 
                         token.includes('railpad') ? 'Railpad-IE' : 'Railwayboard';
            
            return {
                userId: role === 'Admin' ? 999 : 888,
                loginId: role,
                fullName: role + ' User',
                employeeNumber: '00000',
                designation: 'Mock Role',
                department: 'Mock Dept',
                organization: 'RITES',
                region: 'WRIO',
                emailAddress: role.toLowerCase() + '@example.com',
                profilePhotoPath: null
            };
        }

        const empCode = localStorage.getItem('employeeCode') || localStorage.getItem('loginId') || localStorage.getItem('userId');
        const url = empCode ? `${API_ENDPOINTS.PROFILE}?empCode=${empCode}` : API_ENDPOINTS.PROFILE;

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });
        const data = await handleResponse(response);
        return data.responseData;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await fetch(API_ENDPOINTS.PROFILE, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData),
        });
        const data = await handleResponse(response);
        return data.responseData;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const changePassword = async (passwordData) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.PROFILE}/change-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(passwordData),
        });
        const data = await handleResponse(response);
        return data.responseData;
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;
    }
};

export const updateSecuritySettings = async (securityData) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.PROFILE}/security-settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(securityData),
        });
        const data = await handleResponse(response);
        return data.responseData;
    } catch (error) {
        console.error('Error updating security settings:', error);
        throw error;
    }
};
