import customAxios from "../../../utils/axios";

export async function getSettings() {
  const response = await customAxios.get("/api/settings");
  return response.data;
}

export async function updateSettings(data) {
  const response = await customAxios.put("/api/settings", data);
  return response.data;
}

export async function updateAbout(data) {
  const response = await customAxios.put("/api/settings/about", data);
  return response.data;
}

export async function updateContact(data) {
  const response = await customAxios.put("/api/settings/contact", data);
  return response.data;
}

export async function updateFooter(data) {
  const response = await customAxios.put("/api/settings/footer", data);
  return response.data;
}

export async function updateLegal(data) {
  const response = await customAxios.put("/api/settings/legal", data);
  return response.data;
}

export async function updatePrivacyPolicy(privacyPolicy) {
  const response = await customAxios.put("/api/settings/legal/privacy", { privacyPolicy });
  return response.data;
}

export async function updateReturnPolicy(returnPolicy) {
  const response = await customAxios.put("/api/settings/legal/returns", { returnPolicy });
  return response.data;
}

export async function updateTermsOfService(termsOfService) {
  const response = await customAxios.put("/api/settings/legal/terms", { termsOfService });
  return response.data;
}
