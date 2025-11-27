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
  createdAt: Date;
  isActive: boolean;
  actions: {
    id: string;
    zapId: string;
    actionId: string;
    sortingOrder: number;
    type: {
      id: string;
      name: string;
      image: string;
    };
  }[];
  trigger: {
    id: string;
    zapId: string;
    triggerId: string;
    type: {
      id: string;
      name: string;
      image: string;
    };
  };
}

export interface FormField {
  type:
    | "text"
    | "number"
    | "select"
    | "multi-select"
    | "readonly-link"
    | "password"
    | "tag-input"
    | "country-state";
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  description?: string;
  docsLink?: string;
  validation?: {
    isNumberOrPlaceholder?: boolean;
  };
}

export interface Webhook {
  id: string;
  name: string;
  image?: string;
  metadata?: Record<string, any>;
}
