"use client";

import React, { useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { FormField } from "@/lib/types";
import { Button } from "../ui/button";
import Error from "../globals/form-error";
import { z } from "zod";
import toast from "react-hot-toast";
import { CopyIcon } from "lucide-react";
import { HOOKS_URL } from "@/lib/config";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import {
  GITHUB_TRIGGER_FIELDS_MAP,
  LINKEDIN_TRIGGER_FIELDS_MAP,
  INDEED_TRIGGER_FIELDS_MAP,
} from "@/lib/constant";
import { TagInput } from "@/components/globals/Tag-Input";
import { MultiSelect } from "../globals/Multi-Select";
import { useDebounce } from "@/hooks/use-debounce";
import useStore, { Country } from "@/lib/store";
import { useShallow } from "zustand/shallow";

interface DynamicFormProps {
  fields: FormField[];
  initialData: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  schema: z.ZodSchema<any>;
  triggerType?: "github" | "linkedin" | "indeed";
  onClose: () => void;
  nodeId: string;
}

function DynamicForm({
  fields,
  initialData,
  onSubmit,
  schema,
  triggerType,
  onClose,
  nodeId
}: DynamicFormProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const params = useParams();
  const zapId = params.zapId as string;
  const {
    flow: { triggerName, setTriggerName, handleTriggerTypeChange },
    form: {
      formData,
      errors,
      activeInput,
      dynamicFields,
      setFormData,
      setErrors,
      setDynamicFields,
      setActiveInput,
      countries,
      states,
      loadingCountries,
      loadingStates,
      countryError,
      stateError,
      setStates,
      setLoadingStates,
      setStateError,
      fetchCountries,
      fetchStates,
      submitForm,
    },
    user: { userId, setUserId },
  } = useStore(
    useShallow((state) => ({
      form: state.form,
      flow: state.flow,
      user: state.user,
    })),
  );

  useEffect(() => {
    console.log("initialData:", initialData);
    console.log("formData:", formData);
    console.log("triggertype", triggerType)
  }, [formData, initialData]);

  // Get current node's data
  const nodeData = formData.find((node: any) => node.id === nodeId)?.data || {};

  // Initialize formData with node metadata and default githubEventType
  useEffect(() => {
    if (!formData.find((node: any) => node.id === nodeId)) {
      const tmpData = {
        ...initialData,
        ...(triggerType === "github" && !initialData.githubEventType
          ? { githubEventType: "issue_comment" }
          : {}),
      };
      setFormData([...(formData as []), { id: nodeId, data: tmpData }]);
    }
  }, [nodeId, initialData, formData, triggerType, setFormData]);

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);


  // Handle input changes
  const handleInputChange = useCallback(
    (fieldName: string, value: any) => {
      const newNodeData = {
        ...nodeData,
        [fieldName]: value,
      };
      setFormData(
        formData.map((node: any) =>
          node.id === nodeId ? { id: nodeId, data: newNodeData } : node
        )
      );

      // Clear errors when the user starts typing
      if (errors[fieldName]) {
        setErrors({ ...errors, [fieldName]: "" });
      }

      // Update dynamic fields when the event type changes
      if (fieldName === "githubEventType") {
        const fields = GITHUB_TRIGGER_FIELDS_MAP[value || "issue_comment"];
        // setDynamicFields(fields.map((field) => `${field}`));
        setDynamicFields(fields.map((field: string) => `{{trigger.${field}}}`));

        // Update triggerName with the new githubEventType
        setTriggerName((prev: Record<string, any>) => {
          if (prev.githubEventType === value) {
            return prev; // No change, return previous state
          }
          return {
            githubEventType: value,
          };
        });

        if (handleTriggerTypeChange !== undefined) {
          handleTriggerTypeChange("GithubTrigger", value);
        }
      } else if (triggerType === "linkedin") {
        const fields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
        setDynamicFields(fields.map((field) => `${field}`));
      } else if (triggerType === "indeed") {
        const fields = INDEED_TRIGGER_FIELDS_MAP["indeed"];
        setDynamicFields(fields.map((field) => `${field}`));
      }
    },
    [
      nodeData,
      formData,
      errors,
      setFormData,
      setErrors,
      setDynamicFields,
      setTriggerName,
      triggerType,
      handleTriggerTypeChange,
    ],
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use store's submitForm action
    submitForm(
      nodeId,
      fields,
      schema,
      triggerType,
      onSubmit,
      onClose,
    );
  };
  // Handle adding a trigger field to the active input
  const handleAddTriggerField = (field: string) => {
    if (activeInput) {
      const currentValue = nodeData[activeInput] || "";
      handleInputChange(activeInput, `${currentValue} {{trigger.${field}}}`);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success(`Link copied to clipboard!`);
  };

  // Generate the webhook URL based on the selected event type
  const generateWebhookUrl = () => {
    const eventType = triggerName?.githubEventType || "issue_comment";
    return `${HOOKS_URL}/github-webhook/${eventType}/${userId}/${zapId || ""}`;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(response.data.id);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("Failed to load user data.");
      }
    };
    if (!userId) {
      fetchUser();
    }
  }, [userId, setUserId]);

  // Update dynamic fields based on the last saved trigger type
  useEffect(() => {
    let fields: string[] = [];
    if (triggerType === "github") {
      fields =
        GITHUB_TRIGGER_FIELDS_MAP[
        triggerName?.githubEventType || "issue_comment"
        ];
    } else if (triggerType === "linkedin") {
      fields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
    } else if (triggerType === "indeed") {
      fields = INDEED_TRIGGER_FIELDS_MAP["indeed"];
    }
    if (fields !== undefined) {
      setDynamicFields(fields.map((field) => `${field}`));
    }
  }, [triggerName, triggerType]);

  // Debounced fetch states using store's fetchStates
  const debouncedFetchStates = useDebounce(async (countryName: string) => {
    fetchStates(countryName);
  }, 300);

  // Handle country change
  const handleCountryChange = (countryName: string) => {
    debouncedFetchStates(countryName);
  };

  // Fetch states when country changes
  useEffect(() => {
    if (nodeData.country) {
      debouncedFetchStates(nodeData.country);
    } else {
      setStates([]);
      setStateError("");
    }
  }, [nodeData.country]);

  // Render fields based on their type and conditions
  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "number":
      case "password":
        return (
          <div key={field.name} className="flex flex-col gap-2">
            <Label htmlFor={field.name}>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type={field.type}
              id={field.name}
              value={nodeData[field.name] || ""}
              placeholder={field.placeholder}
              className="mt-1 flex-1"
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              onFocus={() => setActiveInput(field.name)} // Set active input on focus
            />
            {/* Buttons to insert trigger fields */}
            {activeInput === field.name && field.type !== "password" && (
              <div className="flex gap-2 flex-wrap">
                {dynamicFields.map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTriggerField(key)}
                  >
                    {`{{trigger.${key}}}`}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      case "select":
        return (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor={field.name}
              className={isDarkMode ? "text-white" : "text-[#111827]"}
            >
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <select
              id={field.name}
              value={
                nodeData[field.name] ||
                (field.name === "githubEventType" ? "issue_comment" : "")
              }
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`mt-1 block w-full p-2 border rounded-md ${isDarkMode
                ? "bg-[#1f2937] border-[#374151] text-white"
                : "bg-white border-[#d1d5db] text-[#111827]"
                }`}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      case "readonly-link":
        const webhookUrl = generateWebhookUrl();
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {field.label}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCopyLink(webhookUrl)}
                disabled={!zapId}
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
            {!zapId && (
              <p className="text-sm text-red-500 mt-1">
                Save the flow to generate the webhook URL.
              </p>
            )}
            {field.description && (
              <p className="text-sm text-gray-300 mx-1 my-4 whitespace-pre-line">
                {field.description}
                <a
                  href={field.docsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Learn more
                </a>
              </p>
            )}
          </div>
        );
      case "multi-select":
        return (
          <MultiSelect
            key={field.name}
            options={field.options || []}
            selected={nodeData[field.name] || []}
            onChange={(selected) => handleInputChange(field.name, selected)}
            label={field.label}
            required={field.required}
          />
        );
      case "tag-input":
        return (
          <TagInput
            key={field.name}
            tags={nodeData[field.name] || []}
            onTagsChange={(tags) => handleInputChange(field.name, tags)}
            placeholder={field.placeholder}
            label={field.label}
            required={field.required}
          />
        );
      case "country-state":
        return (
          <div className="space-y-4">
            {/* Country Select */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="country"
                className={isDarkMode ? "text-white" : "text-[#111827]"}
              >
                Country{" "}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              <select
                id="country"
                value={nodeData.country || ""}
                onChange={(e) => {
                  handleInputChange(field.name, e.target.value)
                  handleCountryChange(e.target.value)
                }}
                className={`mt-1 block w-full p-2 border rounded-md ${isDarkMode
                  ? "bg-[#1f2937] border-[#374151] text-white"
                  : "bg-white border-[#d1d5db] text-[#111827]"
                  }`}
                disabled={loadingCountries}
              >
                <option value="">Select Country</option>
                {countries.map((country: Country) => (
                  <option key={country.iso2} value={country.country}>
                    {country.country}
                  </option>
                ))}
              </select>
              {loadingCountries && (
                <p
                  className={`text-sm ${isDarkMode ? "text-white" : "text-[#111827]"}`}
                >
                  Loading countries...
                </p>
              )}
              {countryError && (
                <p className="text-sm text-red-500">{countryError}</p>
              )}
            </div>

            {/* State Select */}
            {nodeData.country && (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="state"
                  className={isDarkMode ? "text-white" : "text-[#111827]"}
                >
                  State{" "}
                </Label>
                <select
                  id="state"
                  value={nodeData.state || ""}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className={`mt-1 block w-full p-2 border rounded-md ${isDarkMode
                    ? "bg-[#1f2937] border-[#374151] text-white"
                    : "bg-white border-[#d1d5db] text-[#111827]"
                    }`}
                  disabled={loadingStates}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.state_code} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {loadingStates && (
                  <p
                    className={`text-sm ${isDarkMode ? "text-white" : "text-[#111827]"}`}
                  >
                    Loading states...
                  </p>
                )}
                {stateError && (
                  <p className="text-sm text-red-500">{stateError}</p>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
      {fields.map((field, index) => (
        <div key={index}>
          {renderField(field)}
          {errors[field.name] && (
            <Error className="mt-2" errorMessage={errors[field.name]} />
          )}
        </div>
      ))}
      <Button type="submit" className="w-full">
        Save
      </Button>
    </form>
  );
}

export default DynamicForm;
