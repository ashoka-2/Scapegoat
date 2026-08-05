import axios from "../../../utils/axios.js";

const authApiInstance = axios.create({
  baseURL: axios.defaults.baseURL + "/api/auth",
});

export async function register({
  email,
  contact,
  password,
  fullname,
  isSeller,
}) {
  const response = await authApiInstance.post("/register", {
    email,
    contact,
    password,
    fullname,
    isSeller,
  });
  return response.data;
}

export async function login({ identifier, password }) {
  const response = await authApiInstance.post("/login", {
    identifier,
    password,
  });
  return response.data;
}

export async function getMe() {
  const response = await authApiInstance.get("/getMe");
  return response.data;
}

export async function logout() {
  const response = await authApiInstance.post("/logout");
  return response.data;
}

export async function completeProfile({ password, contact, isSeller }) {
  const response = await authApiInstance.post("/complete-profile", {
    password,
    contact,
    isSeller,
  });
  return response.data;
}

export async function updateProfileApi(payload) {
  const response = await authApiInstance.put("/update-profile", payload);
  return response.data;
}

export async function changePasswordApi(payload) {
  const response = await authApiInstance.put("/change-password", payload);
  return response.data;
}

export async function forgotPasswordApi(email) {
  const response = await authApiInstance.post("/forgot-password", { email });
  return response.data;
}

export async function resetPasswordApi({ token, newPassword }) {
  const response = await authApiInstance.post("/reset-password", {
    token,
    newPassword,
  });
  return response.data;
}