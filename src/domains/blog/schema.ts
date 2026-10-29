import { z } from "zod";

import { BLOG_CATEGORIES } from "@/config/site";

const categories = BLOG_CATEGORIES.map((category) => category.value) as [string, ...string[]];

export const blogPostSchema = z.object({
  title: z.string().trim().min(4, "Add a title.").max(140),
  excerpt: z.string().trim().min(20, "Add a short excerpt.").max(320),
  content: z.string().trim().min(50, "The article needs a little more content.").max(50_000),
  category: z.enum(categories, {
    errorMap: () => ({ message: "Choose a category." }),
  }),
  authorName: z.string().trim().min(2, "Add an author name.").max(80),
  coverAlt: z.string().trim().max(180).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(160).optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
