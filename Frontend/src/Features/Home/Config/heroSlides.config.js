// Editable hero art, copy, and image-inspired color palettes.
// Add a preset here when introducing a new category or seasonal campaign.
export const HERO_SLIDE_PRESETS = [
  { key: "footwear", match: /shoe|footwear|sneaker|sandal/i, artwork: "/hero-categories/footwear.png", title: "Step into more", eyebrow: "Made for the long run", gradient: "linear-gradient(125deg, #e4d9ce 0%, #b9a18c 48%, #62514d 100%)" },
  { key: "clothing", match: /women|girl|cloth|cotton|linen|hoodie|shirt|pant|sweater|fashion|polo/i, artwork: "/model.png", title: "Made to move", eyebrow: "Everyday, reimagined", gradient: "linear-gradient(125deg, #f1d9cb 0%, #d9b7aa 46%, #8b5361 100%)" },
  { key: "menswear", match: /\bmen\b|men's|mens|boy/i, artwork: "/hero-categories/menswear.png", title: "Own your style", eyebrow: "Built for every day", gradient: "linear-gradient(125deg, #d9e2e8 0%, #9aaebb 48%, #3b5367 100%)" },
  { key: "stationery", match: /station|book|notebook|paper|pen|pencil/i, artwork: "/hero-categories/stationery.png", title: "Ideas start here", eyebrow: "Make room to create", gradient: "linear-gradient(125deg, #f4e5bd 0%, #d9bd83 48%, #8a6844 100%)" },
  { key: "electronics", match: /computer|electronic|laptop|mobile|phone|camera|gadget/i, artwork: "/hero-categories/electronics.png", title: "Power your day", eyebrow: "Smarter essentials", gradient: "linear-gradient(125deg, #d7e2ec 0%, #8aa8c0 48%, #394f70 100%)" },
  { key: "furniture", match: /furnit|chair|table|sofa|desk/i, artwork: "/hero-categories/furniture.png", title: "Find your space", eyebrow: "Comfort, considered", gradient: "linear-gradient(125deg, #e7d8c6 0%, #c2a58a 48%, #755b4c 100%)" },
  { key: "massagers", match: /massage|massager|wellness/i, artwork: "/hero-categories/massagers.png", title: "Make time to unwind", eyebrow: "A softer kind of day", gradient: "linear-gradient(125deg, #e5dce8 0%, #b7a3c2 48%, #665477 100%)" },
  { key: "tools", match: /tool|hardware|torch|lighter|spare|mixi/i, artwork: "/hero-categories/tools.png", title: "Ready for anything", eyebrow: "Tools that get it done", gradient: "linear-gradient(125deg, #e8dfc9 0%, #b8aa81 48%, #625b43 100%)" },
  { key: "school", match: /school|kid|toy|backpack|bag/i, artwork: "/hero-categories/school.png", title: "Big days begin", eyebrow: "Little things, big ideas", gradient: "linear-gradient(125deg, #e9d6cc 0%, #c99883 48%, #845662 100%)" },
  { key: "home", match: /bottle|home|kitchen|household|decor/i, artwork: "/hero-categories/home.png", title: "Feel at home", eyebrow: "Thoughtful everyday finds", gradient: "linear-gradient(125deg, #e0e5d2 0%, #a8b395 48%, #536956 100%)" },
];

export const DEFAULT_HERO_PRESET = {
  artwork: "/hero-categories/home.png",
  gradient: "linear-gradient(125deg, #e0e5d2 0%, #a8b395 48%, #536956 100%)",
  title: "Find your next favorite",
  eyebrow: "Thoughtful everyday finds",
};

export const getHeroPreset = (name = "") => HERO_SLIDE_PRESETS.find(({ match }) => match.test(name)) || null;
