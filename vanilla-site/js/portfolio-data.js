// Paths in this module are relative to vanilla-site/index.html.
export const socialMediaCategory = {
  id: "social-media",
  name: "Social Media Designs",
  category: "social-media",
  position: [0, 0, 0],
  color: "#bd8cff",
  description: "Visual stories made for the feed. Explore social media posts, campaign creatives, and story layouts designed to bring a brand’s personality to life across digital platforms.",
  formats: ["Facebook", "Instagram", "Campaigns", "Stories"],
  image: "assets/social-media-preview.svg",
  url: "portfolio/social-media.html",
};

// Layout previews only: replace these entries with real projects as artwork is added.
// image paths are relative to portfolio/social-media.html. Set placeholder: false
// and supply a title, description, format, platform, and image for each real project.
export const socialMediaProjects = [
  { id: "facebook-preview", title: "Facebook post designs", platform: "Facebook", format: "Feed posts", description: "A space for branded posts, promotional announcements, and campaign visuals created for Facebook.", image: "../assets/social-media-preview.svg", placeholder: true },
  { id: "instagram-preview", title: "Instagram feed designs", platform: "Instagram", format: "Feed & carousels", description: "A space for Instagram posts and carousel collections, with room to explain the idea behind each design.", image: "../assets/social-media-preview.svg", placeholder: true },
  { id: "stories-preview", title: "Stories & campaign creatives", platform: "Campaigns", format: "Stories & campaigns", description: "A space for vertical stories and coordinated social campaigns, grouped together as complete visual stories.", image: "../assets/social-media-preview.svg", placeholder: true },
];
