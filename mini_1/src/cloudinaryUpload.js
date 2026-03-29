const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

/**
 * Upload a file to Cloudinary via Spring Boot backend
 * @param {File} file - The file to upload
 * @param {string} folder - Cloudinary folder (FIR, VIDEO, CASE_FILE, AADHAAR, PERSONAL)
 * @param {string} token - JWT token (optional, pass null for public upload)
 * @param {function} onProgress - Progress callback (not supported via backend, optional)
 * @returns {Promise<{secure_url, public_id, resource_type, original_name}>}
 */
export const uploadToCloudinary = async (file, folder = 'general', token = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log(`Uploading "${file.name}" to Cloudinary folder: ${folder}`);

    const res = await fetch(`${BACKEND_URL}/upload/file?folder=${folder}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('Cloudinary upload failed:', data);
        throw new Error(data.error || 'Upload failed');
    }

    console.log('Cloudinary upload success:', data.secure_url);
    return data;
};

/**
 * Delete a file from Cloudinary via Spring Boot backend
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'raw', token = null) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
        `${BACKEND_URL}/upload/file?publicId=${encodeURIComponent(publicId)}&resourceType=${resourceType}`,
        { method: 'DELETE', headers }
    );

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
    }
};

/**
 * Test Cloudinary connectivity
 */
export const testCloudinaryConnection = async () => {
    const res = await fetch(`${BACKEND_URL}/upload/test`);
    const data = await res.json();
    console.log('Cloudinary test:', data.status);
    return res.ok;
};
