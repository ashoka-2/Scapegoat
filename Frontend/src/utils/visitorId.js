// Anonymous visitor identity for activity tracking (recommendations).
// A stable per-device id is generated once and persisted — the backend uses it
// to build "For You" recommendations for users who are not logged in.
const KEY = "scapegoat_visitor_id";

export const getVisitorId = () => {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        "v_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 8);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "v_anon";
  }
};
