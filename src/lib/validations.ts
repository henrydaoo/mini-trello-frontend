import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be between 3 and 50 characters")
      .max(50, "Username must be between 3 and 50 characters"),
    email: z.string().min(1, "Email is required").email("Email must be a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const boardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100, "Board name must be at most 100 characters"),
  description: z.string().max(2000, "Description must be at most 2000 characters").optional().or(z.literal("")),
});
export type BoardInput = z.infer<typeof boardSchema>;

export const listSchema = z.object({
  name: z.string().min(1, "List name is required").max(100, "List name must be at most 100 characters"),
});
export type ListInput = z.infer<typeof listSchema>;

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional(), // select value, "" means unassigned
  priority: priorityEnum,
  dueDate: z.string().optional().or(z.literal("")),
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().optional().or(z.literal("")),
  priority: priorityEnum,
  dueDate: z.string().optional().or(z.literal("")),
});
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export const commentSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Content must be at most 2000 characters"),
});
export type CommentInput = z.infer<typeof commentSchema>;

export const addMemberSchema = z.object({
  email: z.string().min(1, "Email is required").email("Email must be valid"),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
