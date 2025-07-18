import { Edge, Node } from "@xyflow/react";
import { FormField, Webhook, Zap } from "@/lib/types";
import { z } from "zod";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import api from "./api";
import axios from "axios";
import {
  GITHUB_TRIGGER_FIELDS_MAP,
  LINKEDIN_TRIGGER_FIELDS_MAP,
} from "./constant";

interface Country {
  country: string;
  iso2: string;
  iso3: string;
}

interface State {
  name: string;
  state_code: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  triggerName: Record<string, any>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setTriggerName: (triggerName: Record<string, any>) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  saveZap: (zapId?: string, scraperType?: string) => Promise<string | void>;
}

interface WebhookState {
  webhooks: Webhook[];
  selectedWebhook: Webhook | null;
  isDialogOpen: boolean;
  hasLinkedInTrigger: boolean;
  setWebhooks: (webhooks: Webhook[]) => void;
  setSelectedWebhook: (webhook: Webhook | null) => void;
  setIsDialogOpen: (open: boolean) => void;
  fetchWebhooks: (type: "action" | "trigger") => Promise<void>;
  checkLinkedInTrigger: () => Promise<void>;
}

interface UserState {
  userId: string;
  name: string;
  email: string;
  userSubscription: string;
  isAuthenticated: boolean;
  userLoading: boolean;
  fetchUser: () => Promise<void>;
  setAuthenticated: (isAuthenticated: boolean) => void;
}

interface FormState {
  formData: Record<string, any>;
  errors: Record<string, string>;
  activeInput: string | null;
  dynamicFields: string[];
  countries: Country[];
  states: State[];
  loadingCountries: boolean;
  loadingStates: boolean;
  countryError: string;
  stateError: string;
  isSubmitting: boolean;
  formStatus: "idle" | "submitting" | "success" | "error";
  cachedFormData: Record<string, Record<string, any>>;
  setFormData: (data: Record<string, any>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setActiveInput: (input: string | null) => void;
  setDynamicFields: (fields: string[]) => void;
  setFormStatus: (status: "idle" | "submitting" | "success" | "error") => void;
  cacheFormData: (nodeId: string, data: Record<string, any>) => void;
  fetchCountries: () => Promise<void>;
  fetchStates: (country: string) => Promise<void>;
  submitForm: (
    fields: FormField[],
    schema: z.ZodSchema<any>,
    triggerType: "github" | "linkedin" | undefined,
    onSubmit: (data: Record<string, any>) => Promise<void>,
    onClose: () => void,
  ) => Promise<void>;
}

interface ZapState {
  zaps: Zap[];
  zapStatus: Record<string, boolean>;
  zapLoading: boolean;
  fetchZaps: () => Promise<void>;
  toggleZap: (zapId: string, isActive: boolean) => Promise<void>;
}

interface UIState {
  sidebarWidth: number;
  isSidebarOpen: boolean;
  toastMessages: ToastMessage[];
  isModalOpen: boolean;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  addToast: (
    message: string | JSX.Element,
    type: "success" | "error" | "info",
  ) => void;
  removeToast: (id: string) => void;
  setModalOpen: (open: boolean) => void;
}

interface AppState {
  flow: FlowState;
  webhook: WebhookState;
  user: UserState;
  form: FormState;
  zap: ZapState;
  ui: UIState;
}

const useStore = create<AppState>()(
  immer((set, get) => ({
    flow: {
      nodes: [],
      edges: [],
      selectedNodeId: null,
      triggerName: [],
      setNodes: (nodes: Node[]) =>
        set((state) => {
          state.flow.nodes = nodes;
        }),
      setEdges: (edges: Edge[]) =>
        set((state) => {
          state.flow.edges = edges;
        }),
      setSelectedNodeId: (id: any) =>
        set((state) => {
          state.flow.selectedNodeId = id;
        }),
      setTriggerName: (triggerName) =>
        set((state) => {
          state.flow.triggerName = triggerName;
        }),
      addNode: (node: any) =>
        set((state) => {
          state.flow.nodes.push(node);
        }),
      addEdge: (edge: any) =>
        set((state) => {
          state.flow.edges.push(edge);
        }),
      updateNodeData: (nodeId: string, data: any) =>
        set((state) => {
          const node = state.flow.nodes.find((n: any) => n.id === nodeId);
          if (node) {
            node.data = { ...node.data, ...data };
          }
        }),
      saveZap: async (zapId?: string | undefined, scraperType = "UNKNOWN") => {
        const {
          flow: { nodes },
          zap: { zaps },
          user,
        } = get();
        if (user.userSubscription === "free" && zaps.length >= 5) {
          //TODO: ADD UPGRADE_URL
          set((state) => {
            state.ui.addToast(
              `Free plan allows only 5 Zaps. Upgrade to SuperGrok at UPGRADE_URL.`,
              "error",
            );
          });
          return;
        }
        // Extract trigger and actions from nodes
        const triggerNode = nodes.find((node: Node) => !node.data.action);
        const actionNodes = nodes.filter((node: Node) => node.data.action);

        // Validate that a trigger and at least one action are present
        if (!triggerNode || actionNodes.length === 0) {
          set((state) => {
            state.ui.addToast(
              "A flow must have at least one trigger and one action.",
              "error",
            );
          });
          return;
        }

        // Prepare data for the backend
        const zapData = {
          availableTriggerId: triggerNode.data.id, // Assuming the trigger node has an ID
          triggerMetadata: triggerNode.data.metadata, // Optional metadata
          actions: actionNodes.map((node) => ({
            availableActionId: node.data.id, // Assuming the action node has an ID
            actionMetadata: node.data.metadata,
          })),
        };

        try {
          const isEditing = !!zapId;
          const token = localStorage.getItem("token");
          if (isEditing) {
            await api.put(`/zap/${zapId}`, zapData, {
              headers: { Authorization: `Bearer ${token}` },
            });
            set((state) => {
              state.ui.addToast("Zap updated successfully!", "success");
            });
          } else {
            const response = await api.post(
              "/zap/",
              { scraperType: scraperType, zapData: zapData },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            set((state) => {
              state.ui.addToast("Zap created successfully!", "success");
            });
            await get().zap.fetchZaps();
            return response.data.zapId;
          }
        } catch (error) {
          console.error("Failed to save Zap:", error);
          set((state) => {
            state.ui.addToast("Failed to save Zap.", "error");
          });
        }
      },
    },
    webhook: {
      webhooks: [],
      selectedWebhook: null,
      isDialogOpen: false,
      hasLinkedInTrigger: false,
      setWebhooks: (webhooks) =>
        set((state) => {
          state.webhook.webhooks = webhooks;
        }),
      setSelectedWebhook: (webhook) =>
        set((state) => {
          state.webhook.selectedWebhook = webhook;
        }),
      setIsDialogOpen: (open) =>
        set((state) => {
          state.webhook.isDialogOpen = open;
        }),
      fetchWebhooks: async (type) => {
        try {
          const response = await api.get(
            type === "action" ? "/action/available" : "/trigger/available",
          );
          const webhooks =
            type === "action"
              ? response.data.availableActions
              : response.data.availableTriggers;
          set((state) => {
            state.webhook.webhooks = webhooks;
          });
        } catch (error) {
          console.error(`Failed to fetch ${type}s:`, error);
          set((state) => {
            state.ui.addToast(`Failed to load ${type}s.`, "error");
          });
        }
      },
      checkLinkedInTrigger: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await api.get(
            "/trigger-response/hasLinkedInTrigger",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          set((state) => {
            state.webhook.hasLinkedInTrigger = response.data.hasLinkedInTrigger;
          });
        } catch (error) {
          console.error("Failed to check LinkedIn trigger:", error);
          set((state) => {
            state.ui.addToast("Failed to check LinkedIn trigger.", "error");
          });
        }
      },
    },
    user: {
      userId: "",
      name: "",
      email: "",
      userSubscription: "free",
      isAuthenticated: false,
      userLoading: true,
      fetchUser: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            set((state) => {
              state.user.isAuthenticated = false;
              state.user.userLoading = false;
            });
            return;
          }
          const response = await api.get("/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          set((state) => {
            state.user.userId = response.data.id;
            state.user.name = response.data.name || "";
            state.user.email = response.data.email || "";
            state.user.userSubscription = response.data.subscription || "free";
            state.user.isAuthenticated = true;
            state.user.userLoading = false;
          });
        } catch (error) {
          console.error("Failed to fetch user:", error);
          set((state) => {
            state.user.isAuthenticated = false;
            state.user.userLoading = false;
            state.ui.addToast("Failed to load user data.", "error");
          });
        }
      },
      setAuthenticated: (isAuthenticated) =>
        set((state) => {
          state.user.isAuthenticated = isAuthenticated;
        }),
    },
    form: {
      formData: {},
      errors: {},
      activeInput: null,
      dynamicFields: [],
      countries: [],
      states: [],
      loadingCountries: false,
      loadingStates: false,
      countryError: "",
      stateError: "",
      isSubmitting: false,
      formStatus: "idle",
      cachedFormData: {},
      setFormData: (data) =>
        set((state) => {
          state.form.formData = data;
        }),
      setErrors: (errors) =>
        set((state) => {
          state.form.errors = errors;
        }),
      setActiveInput: (input) =>
        set((state) => {
          state.form.activeInput = input;
        }),
      setDynamicFields: (fields) =>
        set((state) => {
          state.form.dynamicFields = fields;
        }),
      setFormStatus: (status) =>
        set((state) => {
          state.form.formStatus = status;
        }),
      cacheFormData: (nodeId, data) =>
        set((state) => {
          state.form.cachedFormData[nodeId] = data;
        }),
      fetchCountries: async () => {
        try {
          set((state) => {
            state.form.loadingCountries = true;
          });
          const cachedCountries = localStorage.getItem("countries");
          if (cachedCountries) {
            set((state) => {
              state.form.countries = JSON.parse(cachedCountries);
            });
            return;
          }
          const response = await axios.get(
            "https://countriesnow.space/api/v0.1/countries",
          );
          set((state) => {
            state.form.countries = response.data.data;
          });
          localStorage.setItem("countries", JSON.stringify(response.data.data));
        } catch (error) {
          console.error("Country fetch error:", error);
          set((state) => {
            state.form.countryError = "Failed to load countries";
            state.ui.addToast("Failed to load countries.", "error");
          });
        } finally {
          set((state) => {
            state.form.loadingCountries = false;
          });
        }
      },
      fetchStates: async (country) => {
        if (!country) return;
        try {
          set((state) => {
            state.form.loadingStates = true;
          });
          const response = await axios.post(
            "https://countriesnow.space/api/v0.1/countries/states",
            { country },
          );
          set((state) => {
            state.form.states = response.data.data.states || [];
            state.form.stateError = "";
          });
        } catch (error) {
          console.error("State fetch error:", error);
          set((state) => {
            state.form.stateError = "Failed to load states";
            state.ui.addToast("Failed to load states.", "error");
          });
        } finally {
          set((state) => {
            state.form.loadingStates = false;
          });
        }
      },
      submitForm: async (fields, schema, triggerType, onSubmit, onClose) => {
        set((state) => {
          state.form.isSubmitting = true;
          state.form.formStatus = "submitting";
        });
        const {
          form: { formData },
          flow: { triggerName },
        } = get();
        const updatedFormData = { ...formData };

        let allowedFields: string[] = [];
        if (triggerType === "github") {
          if (!updatedFormData.githubEventType) {
            updatedFormData.githubEventType = "issue_comment";
          }
          allowedFields =
            GITHUB_TRIGGER_FIELDS_MAP[
              updatedFormData.githubEventType ||
                triggerName?.githubEventType ||
                "issue_comment"
            ];
        } else if (triggerType === "linkedin") {
          allowedFields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
          if (!updatedFormData.keywords?.length) {
            set((state) => {
              state.form.errors.keywords = "At least one keyword is required";
              state.form.formStatus = "error";
              state.ui.addToast("At least one keyword is required", "error");
            });
            return;
          }
          if (!updatedFormData.country) {
            set((state) => {
              state.form.errors.country = "Country is required";
              state.form.formStatus = "error";
              state.ui.addToast("Country is required", "error");
            });
            return;
          }
        }

        for (const field of fields) {
          if (
            field.name === "githubEventType" ||
            field.name === "githubwebhook"
          )
            continue;
          const value = updatedFormData[field.name];
          if (typeof value === "string") {
            const placeholders = value.match(/{{trigger\.([^}]+)}}/g) || [];
            const isValid = placeholders.every((p) =>
              allowedFields.includes(p.replace(/{{trigger\.([^}]+)}}/, "$1")),
            );
            if (!isValid) {
              set((state) => {
                state.form.errors[field.name] =
                  `Invalid placeholder for ${field.name}. Allowed: ${allowedFields.join(", ")}`;
                state.form.formStatus = "error";
                state.ui.addToast("Invalid input field", "error");
              });
              return;
            }
          }
          if (field.validation?.isNumberOrPlaceholder) {
            const isValid =
              value &&
              (!isNaN(parseFloat(value)) ||
                value.trim() === "{{trigger.Amount}}");
            if (!isValid) {
              set((state) => {
                state.form.errors[field.name] =
                  `Invalid value for ${field.name}. Must be a number or {{trigger.Amount}}`;
                state.form.formStatus = "error";
                state.ui.addToast("Invalid input field", "error");
              });
              return;
            }
          }
        }

        if (
          fields.some((f) => f.name === "Amount") &&
          !updatedFormData.Amount
        ) {
          set((state) => {
            state.form.errors.Amount = "Amount is required";
            state.form.formStatus = "error";
            state.ui.addToast("Amount is required", "error");
          });
          return;
        }

        try {
          const validatedData = schema.parse(updatedFormData);
          await onSubmit(validatedData);
          set((state) => {
            state.form.formStatus = "success";
            state.ui.addToast("Saved successfully!", "success");
          });
          onClose();
        } catch (error) {
          set((state) => {
            state.form.formStatus = "error";
          });
          if (error instanceof z.ZodError) {
            const newErrors: Record<string, string> = {};
            error.errors.forEach((err) => {
              newErrors[err.path[0]] = `${err.message} ${err.path[0]}`;
            });
            set((state) => {
              state.form.errors = newErrors;
              state.ui.addToast(
                "Please fix the errors before submitting.",
                "error",
              );
            });
          } else {
            set((state) => {
              state.ui.addToast("Failed to save. Please try again.", "error");
            });
          }
        } finally {
          set((state) => {
            state.form.isSubmitting = false;
          });
        }
      },
    },
    zap: {
      zaps: [],
      zapStatus: {},
      zapLoading: true,
      fetchZaps: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await api.get("/zap/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const zaps = response.data.zaps || [];
          set((state) => {
            state.zap.zaps = zaps;
            state.zap.zapStatus = zaps.reduce(
              (acc: Record<string, boolean>, zap: Zap) => {
                acc[zap.id] = zap.isActive;
                return acc;
              },
              {},
            );
            state.zap.zapLoading = false;
          });
        } catch (error) {
          console.error("Failed to fetch Zaps:", error);
          set((state) => {
            state.zap.zapLoading = false;
            state.ui.addToast("Failed to load workflows.", "error");
          });
        }
      },
      toggleZap: async (zapId, isActive) => {
        try {
          const token = localStorage.getItem("token");
          await api.patch(
            `/zap/${zapId}`,
            { isActive },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          set((state) => {
            state.zap.zapStatus[zapId] = isActive;
            state.ui.addToast(
              `Zap ${isActive ? "enabled" : "disabled"} successfully!`,
              "success",
            );
          });
        } catch (error) {
          console.error("Failed to toggle Zap:", error);
          set((state) => {
            state.ui.addToast("Failed to update Zap status.", "error");
          });
        }
      },
    },
    ui: {
      sidebarWidth: 384,
      isSidebarOpen: true,
      toastMessages: [],
      isModalOpen: false,
      setSidebarWidth: (width) =>
        set((state) => {
          state.ui.sidebarWidth = width;
          localStorage.setItem("sidebarWidth", width.toString());
        }),
      toggleSidebar: () =>
        set((state) => {
          state.ui.isSidebarOpen = !state.ui.isSidebarOpen;
        }),
      addToast: (message, type) =>
        set((state) => {
          state.ui.toastMessages.push({
            id: Date.now().toString(),
            message,
            type,
          });
        }),
      removeToast: (id) =>
        set((state) => {
          state.ui.toastMessages = state.ui.toastMessages.filter(
            (t: any) => t.id !== id,
          );
        }),
      setModalOpen: (open) =>
        set((state) => {
          state.ui.isModalOpen = open;
        }),
    },
  })),
);

export default useStore;
