import base from "./base.service";

const instance = base.service(false);
const securedInstance = base.service(true);
const sessionStorageKey = "auth";

export const login = (username, password) =>
  instance.post("/auth/login", { username, password }).then((res) => {
    const user = res.data;
    if (user.token) {
      sessionStorage.setItem(sessionStorageKey, user.token);
      return { ...user, token: null };
    } else return { ...user, activate: true };
  });

export const state = () => securedInstance.get("/auth/state").then((res) => res.data);

export const logout = (username) => securedInstance.post("/auth/logout", username);

export default {
  login,
  state,
  logout
};
