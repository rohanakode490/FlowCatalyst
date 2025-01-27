import { z } from "zod";

export const EditUserProfileSchema = z.object({
  email: z.string().email("Required"),
  name: z.string().min(3, "Required"),
});

//zap types
export interface Zap {
  id: string;
  trigggerId: string;
  userId: number;
  actions: {
    id: string;
    zapId: string;
    actionId: string;
    sortingOrder: number;
    type: {
      id: string;
      name: string;
    };
  }[];
  trigger: {
    id: string;
    zapId: string;
    triggerId: string;
    type: {
      id: string;
      name: string;
    };
  };
}

export interface FormField {
  type: "text" | "number" | "select" | "checkbox" | "password";
  label: string;
  name: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  description?: string;
  condition?: string;
}
