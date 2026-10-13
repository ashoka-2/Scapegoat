// Legal copy is admin-authored but is rendered publicly. Keep formatting while
// dropping executable markup and unsafe URLs without adding a heavy dependency.
const allowedTags = new Set(["P", "BR", "H1", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "A"]);

export const sanitizeLegalHtml = (html = "") => {
  if (typeof window === "undefined") return "";
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.body.querySelectorAll("*").forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }
    [...node.attributes].forEach((attribute) => {
      const safeLink = node.tagName === "A" && attribute.name === "href" && /^(https?:|mailto:|\/|#)/i.test(attribute.value);
      if (!safeLink) node.removeAttribute(attribute.name);
    });
    if (node.tagName === "A" && node.getAttribute("href")?.startsWith("http")) {
      node.setAttribute("rel", "noopener noreferrer");
      node.setAttribute("target", "_blank");
    }
  });
  return documentNode.body.innerHTML;
};
