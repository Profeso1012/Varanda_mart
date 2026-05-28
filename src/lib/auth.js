// Store the access token for the current browser tab/session.
export const setAccessToken = (token) => {
    sessionStorage.setItem('sellerToken', token);
};

export const getAccessToken = () =>
    sessionStorage.getItem('sellerToken') || null;

export const clearAccessToken = () => {
    sessionStorage.removeItem('sellerToken');
};
