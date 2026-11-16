// Shared content source, edited by the local admin panel.
import { siteContent } from "./site-content.js";
export const portfolioCategories = siteContent.categories.filter(category => category.visible !== false);
