// Shared content source, edited by the local admin panel.
import { siteContent } from "./site-content.js";
export const portfolioCategories = siteContent.categories.filter(category => category.visible !== false);
export const socialMediaCategory = siteContent.categories.find(category => category.id === "social-media");
export const socialMediaProjects = socialMediaCategory.projects;
