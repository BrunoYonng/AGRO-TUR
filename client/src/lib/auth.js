const USER_KEY = "agrotur_user";
const TOKEN_KEY = "agrotur_token";

export const roleLabels = {
  TOURIST: "Visitante",
  MANAGER: "Gestor",
  FARMER: "Fazendeiro",
};

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function canUseDashboard(user) {
  return ["MANAGER", "FARMER"].includes(user?.role);
}
