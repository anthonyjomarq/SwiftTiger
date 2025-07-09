export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

export const hasRole = (requiredRoles) => {
  const user = getUser();
  if (!user) return false;
  
  if (typeof requiredRoles === 'string') {
    return user.role === requiredRoles;
  }
  
  return requiredRoles.includes(user.role);
};

export const isMainAdmin = () => {
  const user = getUser();
  return user?.isMainAdmin === true;
};