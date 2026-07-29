import axios from "../../../utils/axios.js";

const authApiInstance = axios.create({
  baseurl: axios.defaults.baseURL + "/api/auth",
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
  return response.data
}


export async function login({ identifier, password }) {
    const response = await authApiInstance.post("/login", {
        identifier, password
    })

    return response.data
}

export async function getMe() {
    const response = await authApiInstance.get("/me")
    return response.data
}

export async function logout() {
    const response = await authApiInstance.post("/logout")
    return response.data
}