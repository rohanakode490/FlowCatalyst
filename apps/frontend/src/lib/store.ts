import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
} from "@xyflow/react";
import { FormField, Webhook, Zap } from "@/lib/types";
import { z } from "zod";
import { createWithEqualityFn } from "zustand/traditional";
import { immer } from "zustand/middleware/immer";
import api from "./api";
import axios from "axios";
import {
  GITHUB_TRIGGER_FIELDS_MAP,
  LINKEDIN_TRIGGER_FIELDS_MAP,
} from "./constant";
import {
  addNodeBelow,
  alignNodesVertically,
  EdgeType,
  NodeType,
} from "@/components/react-flow/Flow-Helpers";
import { VERTICAL_SPACING } from "@/components/react-flow/Flow";

export interface Country {
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
  message: string | JSX.Element;
  type: "success" | "error" | "info";
}

interface Spreadsheet {
  spreadsheetId: string;
  title: string;
  sheets: string[];
}

interface FlowState {
  nodes: NodeType[];
  edges: EdgeType[];
  selectedNodeId: string;
  triggerName: any; //Record<string, any>;
  originalTriggerMetadata: Record<string, any>;
  currentTriggerType: string;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: NodeType[] | ((prev: NodeType[]) => NodeType[])) => void;
  setEdges: (edges: EdgeType[] | ((prev: EdgeType[]) => EdgeType[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setTriggerName: (triggerName: Record<string, any>) => void;
  setOriginalTriggerMetadata: (metadata: Record<string, any>) => void;
  setCurrentTriggerType: (triggerType: string) => void;
  addNode: (sourceNodeId: string) => void;
  handleTriggerTypeChange: (triggerTypeId: string, trigg: Record<string, any>) => void;
  addFlowEdge: (edge: EdgeType) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  saveZap: (zapId?: string, scraperType?: string) => Promise<string | void>;
}

interface WebhookState {
  webhooks: Webhook[];
  selectedWebhook: Webhook | null;
  isDialogOpen: boolean;
  setWebhooks: (webhooks: Webhook[]) => void;
  setSelectedWebhook: (webhook: Webhook | null) => void;
  setIsDialogOpen: (open: boolean) => void;
  fetchWebhooks: (type: "action" | "trigger") => Promise<void>;
  checkRestrictedTrigger: (triggerType: string) => Promise<boolean>;
}

interface UserState {
  userId: string;
  name: string;
  email: string;
  userSubscription: string;
  isAuthenticated: boolean;
  userLoading: boolean;
  refreshToken: string;
  fetchUser: () => Promise<void>;
  setUserId: (userId: string) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setRefreshToken: (token: string) => void;
}

interface FormState {
  formData: Record<string, any>[];
  errors: Record<string, string>;
  activeInput: string | null;
  dynamicFields: string[];
  countries: Country[];
  states: State[];
  spreadsheets: Spreadsheet[];
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingSpreadsheets: boolean;
  countryError: string;
  stateError: string;
  spreadsheetError: string;
  isSubmitting: boolean;
  formStatus: "idle" | "submitting" | "success" | "error";
  cachedFormData: Record<string, Record<string, any>>;
  setFormData: (data: Record<string, any>[]) => void;
  setErrors: (errors: Record<string, string>) => void;
  setActiveInput: (input: string | null) => void;
  setDynamicFields: (fields: string[]) => void;
  setCountries: (countries: Country[]) => void;
  setStates: (states: State[]) => void;
  setSpreadsheets: (spreadsheets: Spreadsheet[]) => void;
  setLoadingCountries: (loading: boolean) => void;
  setLoadingStates: (loading: boolean) => void;
  setLoadingSpreadsheets: (loading: boolean) => void;
  setCountryError: (error: string) => void;
  setStateError: (error: string) => void;
  setSpreadsheetError: (error: string) => void;
  setFormStatus: (status: "idle" | "submitting" | "success" | "error") => void;
  cacheFormData: (nodeId: string, data: Record<string, any>) => void;
  fetchCountries: () => Promise<void>;
  fetchStates: (country: string) => Promise<void>;
  fetchSpreadsheets: () => Promise<void>;
  submitForm: (
    nodeId: string,
    fields: FormField[],
    schema: z.ZodSchema<any>,
    triggerType: "github" | "linkedin" | "indeed" | undefined,
    onSubmit: (data: Record<string, any>) => void,
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

const initialNodes = [
  {
    id: "1",
    type: "customNode",
    position: { x: 0, y: 0 },
    data: {
      name: "Trigger",
      image:
        "https://res.cloudinary.com/dmextegpu/image/upload/v1738394735/webhook_cpzcgw.png",
      configured: false,
      action: false,
      metadata: {},
      onOpenDialog: () => console.log("Open dialog"),
      canDelete: true,
      onDelete: (id: string) => console.log(`Delete node ${id}`),
      onWebhookSelect: () => console.log("Webhook select"),
      onFormSubmit: () => console.log("Form submit"),
    },
  },
  {
    id: "2",
    type: "customNode",
    position: { x: 0, y: 300 },
    data: {
      name: "Action",
      image:
        "https://res.cloudinary.com/dmextegpu/image/upload/v1738418144/icons8-process-500_mi2vrh.png",
      configured: false,
      action: true,
      metadata: {},
      onOpenDialog: () => console.log("Open dialog"),
      canDelete: true,
      onDelete: (id: string) => console.log(`Delete node ${id}`),
      onWebhookSelect: () => console.log("Webhook select"),
      onFormSubmit: () => console.log("Form submit"),
    },
  },
];

const initialEdges = [
  {
    id: "e2-2",
    type: "buttonEdge",
    source: "1",
    target: "2",
    data: { onAddNode: () => console.log("AddNode") },
  },
];

const validateNumberOrPlaceholder = (
  value: string | undefined | null,
): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  // Check if the value is a valid number
  if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
    return true;
  }
  // Check if the value is exactly the placeholder {{trigger.Amount}}
  return value.trim() === "{{trigger.Amount}}";
};

const useStore = createWithEqualityFn<AppState>()(
  immer((set, get) => ({
    flow: {
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: "",
      triggerName: [],
      originalTriggerMetadata: {},
      currentTriggerType: "",
      onNodesChange: (changes) => {
        set((state) => {
          state.flow.nodes = applyNodeChanges(
            changes,
            get().flow.nodes,
          ) as NodeType[];
        });
      },
      onEdgesChange: (changes) => {
        set((state) => {
          state.flow.edges = applyEdgeChanges(
            changes,
            get().flow.edges,
          ) as EdgeType[];
        });
      },
      onConnect: (connection) => {
        const edges = get().flow.edges;
        // Check if the source node already has an outgoing edge
        const hasOutgoingEdge = edges.some(
          (edge) => edge.source === connection.source,
        );
        // Check if the target node already has an incoming edge
        const hasIncomingEdge = edges.some(
          (edge) => edge.target === connection.target,
        );

        if (hasOutgoingEdge) {
          set((state) => {
            state.ui.addToast(
              "Source node already has an outgoing edge!",
              "error",
            );
          });
          return;
        }

        if (hasIncomingEdge) {
          set((state) => {
            state.ui.addToast(
              "Target node already has an incoming edge!",
              "error",
            );
          });
          return;
        }

        // If checks pass, add the new edge
        set((state) => {
          state.flow.edges = addEdge(
            { ...connection, type: "buttonEdge" },
            get().flow.edges,
          ) as EdgeType[];
        });
      },
      setNodes: (nodes) =>
        set((state) => {
          state.flow.nodes =
            typeof nodes === "function" ? nodes(state.flow.nodes) : nodes;
        }),
      setEdges: (edges) =>
        set((state) => {
          state.flow.edges =
            typeof edges === "function" ? edges(state.flow.edges) : edges;
        }),
      setSelectedNodeId: (id: any) =>
        set((state) => {
          state.flow.selectedNodeId = id;
        }),
      setTriggerName: (dataOrFn) =>
        set((state) => {
          const newTriggerName = typeof dataOrFn === "function" ? dataOrFn(state.flow.triggerName) : dataOrFn;
          state.flow.triggerName = newTriggerName;
        }),
      setOriginalTriggerMetadata: (metadata) =>
        set((state) => {
          state.flow.originalTriggerMetadata = metadata;
        }),
      setCurrentTriggerType: (triggerType) =>
        set((state) => {
          state.flow.currentTriggerType = triggerType
        }),
      handleTriggerTypeChange: (triggerTypeId, triggerMetadata) =>
        set((state) => {
          const { flow: { originalTriggerMetadata, nodes, currentTriggerType }, form: { formData } } = state;
          let newNodes = nodes;
          let newFormData = formData;
          let newCurrentTriggerType = currentTriggerType;
          let toastMessage = "";
          let toastType: "success" | "info" | "error" = "info";

          // Determine if the selected trigger is new or reverting to the original
          const isOriginalTrigger = originalTriggerMetadata && triggerTypeId === currentTriggerType;
          const metadataToUse = isOriginalTrigger ? originalTriggerMetadata : triggerMetadata;

          if (triggerTypeId === "GithubTrigger") {
            // newTriggerName = metadataToUse.githubEventType ? metadataToUse : { githubEventType: "issue_comment" };
            newNodes = nodes.map((node) =>
              node.id === "1"
                ? {
                  ...node,
                  data: {
                    ...node.data,
                    metadata: metadataToUse,
                    configured: isOriginalTrigger ? true : false
                  },
                }
                : node
            );
            newFormData = formData.map((node) =>
              node.id === "1"
                ? { ...node, data: metadataToUse }
                : node
            );
            toastMessage = isOriginalTrigger
              ? "Reverted to original GitHub event type"
              : "Switched to GitHub trigger";
          } else if (triggerTypeId === "LinkedinTrigger") {
            // newTriggerName = metadataToUse.type === "LINKEDIN_JOBS"
            newNodes = nodes.map((node) =>
              node.id === "1"
                ? {
                  ...node,
                  data: {
                    ...node.data,
                    metadata: metadataToUse,
                    configured: isOriginalTrigger ? true : false
                  },
                }
                : node
            );
            newFormData = formData.map((node) =>
              node.id === "1"
                ? { ...node, data: metadataToUse }
                : node
            );

            toastMessage = isOriginalTrigger
              ? "Reverted to original LinkedIn settings"
              : "Switched to LinkedIn trigger";
          } else if (triggerTypeId === "indeed") {
            // newTriggerName = { query: originalTriggerMetadata.query, location: originalTriggerMetadata.location };
            newNodes = nodes.map((node) =>
              node.id === "1"
                ? {
                  ...node,
                  data: {
                    ...node.data,
                    metadata: metadataToUse,
                    configured: isOriginalTrigger ? true : false,
                  },
                }
                : node
            );
            newFormData = formData.map((node) =>
              node.id === "1"
                ? { nodeid: "1", data: { ...node.data, metadataToUse } }
                : node
            );
            toastMessage = isOriginalTrigger
              ? "Reverted to original Indeed settings"
              : "Switched to Indeed trigger";
            state.ui.addToast("Reverted to original Indeed settings", "info");
          }
          else {
            toastMessage = "Unknown trigger type selected";
            toastType = "error";
          }

          // Update current trigger type if it's a new trigger
          if (!isOriginalTrigger) {
            newCurrentTriggerType = triggerTypeId;
          }

          if (toastMessage) {
            state.ui.addToast(toastMessage, toastType);
          }

          return {
            flow: { ...state.flow, nodes: newNodes, currentTriggerType: newCurrentTriggerType },
            form: { ...state.form, formData: newFormData },
          };
        }),
      addNode: (sourceNodeId: string) =>
        set((state) => {
          const result = addNodeBelow(
            state.user.userSubscription,
            sourceNodeId,
            state.flow.nodes,
            state.flow.edges,
            (nodes) =>
            (state.flow.nodes =
              typeof nodes === "function" ? nodes(state.flow.nodes) : nodes),
            (edges) =>
            (state.flow.edges =
              typeof edges === "function" ? edges(state.flow.edges) : edges),
            VERTICAL_SPACING,
            alignNodesVertically,
          );
          if (result === 0) {
            state.ui.addToast(
              "Free plan allows only 3 nodes. Upgrade to SuperGrok at https://x.ai/grok.",
              "error",
            );
          } else if (result === -1) {
            state.ui.addToast("Invalid source node.", "error");
          }
        }),
      addFlowEdge: (edge) =>
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
        const triggerNode = nodes.find((node: NodeType) => !node.data.action);
        const actionNodes = nodes.filter((node: NodeType) => node.data.action);

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
      checkRestrictedTrigger: async (triggerType) => {
        try {
          const token = localStorage.getItem("token");
          const response = await api.get(
            `/trigger-response/hasTrigger?type=${encodeURIComponent(triggerType)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          return response.data.hasTrigger;
        } catch (error) {
          console.error(`Failed to check trigger ${triggerType}:`, error);
          set((state) => {
            state.ui.addToast(
              `Failed to check trigger ${triggerType}.`,
              "error",
            );
          });
          return false;
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
      refreshToken: "",
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
          console.log("user", response.data.user)
          set((state) => {
            state.user.userId = response.data.id;
            state.user.name = response.data.user.name || "";
            state.user.email = response.data.user.email || "";
            state.user.userSubscription = response.data.user.subscription || "free";
            state.user.isAuthenticated = true;
            state.user.userLoading = false;
            state.user.refreshToken = response.data.user.googleRefreshToken || "";
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
      setUserId: (userId) => {
        set((state) => {
          state.user.userId = userId;
        });
      },
      setAuthenticated: (isAuthenticated) => {

        set((state) => {
          state.user.isAuthenticated = isAuthenticated;
        })
      },
      setRefreshToken: (token) => {
        set((state) => {
          state.user.refreshToken = token;
        })
      }
    },
    form: {
      formData: [],
      errors: {},
      activeInput: null,
      dynamicFields: [],
      countries: [],
      states: [],
      spreadsheets: [],
      loadingCountries: false,
      loadingStates: false,
      loadingSpreadsheets: false,
      countryError: "",
      stateError: "",
      spreadsheetError: "",
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
      setCountries: (countries) =>
        set((state) => {
          state.form.countries = countries;
        }),
      setStates: (states) =>
        set((state) => {
          state.form.states = states;
        }),
      setSpreadsheets: (spreadsheets) =>
        set((state) => {
          state.form.spreadsheets = spreadsheets;
        }),
      setLoadingCountries: (loading) =>
        set((state) => {
          state.form.loadingCountries = loading;
        }),
      setLoadingStates: (loading) =>
        set((state) => {
          state.form.loadingStates = loading;
        }),
      setLoadingSpreadsheets: (loading) =>
        set((state) => {
          state.form.loadingSpreadsheets = loading;
        }),
      setCountryError: (error) =>
        set((state) => {
          state.form.countryError = error;
        }),
      setStateError: (error) =>
        set((state) => {
          state.form.stateError = error;
        }),
      setSpreadsheetError: (error) =>
        set((state) => {
          state.form.spreadsheetError = error;
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
      fetchSpreadsheets: async () => {
        try {
          set((state) => {
            state.form.loadingSpreadsheets = true;
            state.form.spreadsheetError = "";
          });

          const { user: { refreshToken } } = get();

          const token = localStorage.getItem("token");
          const response = await api.post("/sheets/list",
            { refresh_token: refreshToken },
            {
              headers: { Authorization: `Bearer ${token}` },
            });
          set((state) => {
            state.form.spreadsheets = response.data.spreadsheets || [];
          });
        } catch (error) {
          console.error("Spreadsheet fetch error:", error);
          set((state) => {
            state.form.spreadsheetError = "Failed to load spreadsheets";
            state.ui.addToast("Failed to load spreadsheets.", "error");
          });
        } finally {
          set((state) => {
            state.form.loadingSpreadsheets = false;
          });
        }
      },
      submitForm: async (nodeId, fields, schema, triggerType, onSubmit, onClose) => {
        set((state) => {
          state.form.isSubmitting = true;
          state.form.formStatus = "submitting";
          state.form.errors = {}
        });
        const {
          form: { formData },
          user: { refreshToken },
          flow: { triggerName },
        } = get();
        const nodeData = formData.find((node: any) => node.id === nodeId)?.data || {};
        const updatedFormData = { ...nodeData };

        let allowedFields: string[] = [];

        // Check if triggerName or triggerData has githubEventType
        if (triggerType === "github") {
          // Ensure githubEventType has a default value if it's empty
          if (
            updatedFormData.githubEventType === undefined ||
            updatedFormData.githubEventType === ""
          ) {
            updatedFormData.githubEventType = "issue_comment"; // Default value
          }
          allowedFields =
            GITHUB_TRIGGER_FIELDS_MAP[
            updatedFormData.githubEventType ||
            triggerName?.githubEventType ||
            "issue_comment"
            ];
        } else if (triggerType === "linkedin" || triggerType === "indeed") {
          allowedFields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
          if (nodeId === '0') { //Trigger Node
            if (!updatedFormData.keywords?.length) {
              set((state) => {
                state.form.errors.keywords = "At least one keyword is required";
                state.form.formStatus = "error";
                state.ui.addToast("At least one keyword is required", "error");
              });
              return;
            }
            if (!updatedFormData.country?.length) {
              set((state) => {
                state.form.errors.country = "Country is required";
                state.form.formStatus = "error";
                state.ui.addToast("Country is required", "error");
              });
              return;
            }
          }
        }

        // Check if proper dynamic fields are assigned
        for (const field of fields) {
          if (
            field.name === "githubEventType" ||
            field.name === "githubwebhook"
          )
            continue;
          const value = updatedFormData[field.name];
          // Validate placeholders for fields that support them
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
          // Validate number/placeholder fields
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

        // Validate the amount field
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

        // If sheets schema add refreshToken
        if (updatedFormData.hasOwnProperty("sheetid") && refreshToken) {
          updatedFormData.refreshToken = refreshToken
        }

        // Replace placeholders with actual values
        const processedData = { ...updatedFormData };
        for (const key in processedData) {
          const value = processedData[key];

          // If the field is a number/placeholder field
          if (
            fields.find((f) => f.name === key)?.validation
              ?.isNumberOrPlaceholder
          ) {
            if (
              typeof value === "string" &&
              validateNumberOrPlaceholder(value)
            ) {
              // If the value contains a placeholder, save it as is
              processedData[key] = value;
            } else if (!isNaN(parseFloat(value))) {
              processedData[key] = value;
            } else {
              // If the value is invalid, set it to 0
              processedData[key] = "0";
            }
          }
        }

        // Skip validation if schema is for github-webhook which is only a link
        if (Array.isArray(schema)) {
          onSubmit(processedData);
          onClose();
          set((state) => {
            state.ui.addToast("Saved successfully!", "success");
          });
          return;
        }
        try {
          const validatedData = schema.parse(processedData);
          onSubmit(validatedData);
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
