"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
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
} from "@/lib/constant";
import { TagInput } from "@/components/globals/Tag-Input";
import { MultiSelect } from "../globals/Multi-Select";
import { useDebounce } from "@/hooks/use-debounce";
import axios from "axios";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  schema: z.ZodSchema<any>;
  triggerType?: "github" | "linkedin";
  triggerData?: Record<string, any>;
  triggerName?: Record<string, any>;
  setTriggerName: Dispatch<SetStateAction<Record<string, any>>>;
  onClose: () => void;
  handleTriggerTypeChange?: (trigger: string) => void;
}

interface Country {
  country: string;
  iso2: string;
  iso3: string;
}

interface State {
  name: string;
  state_code: string;
}

function DynamicForm({
  fields,
  onSubmit,
  initialData,
  schema,
  triggerType,
  triggerData,
  triggerName,
  setTriggerName,
  onClose,
  handleTriggerTypeChange,
}: DynamicFormProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const params = useParams();
  const zapId = params.zapId as string;
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data = { ...(initialData || {}) };

    // Check if triggerName or triggerData has githubEventType
    if (triggerType === "github") {
      // Set the default value only if githubEventType is not already set in initialData
      if (data.githubEventType === undefined || data.githubEventType === "") {
        data.githubEventType = "issue_comment"; // Default value
      }
    }
    return data;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [dynamicFields, setDynamicFields] = useState<string[]>([]);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");

  // Handle input changes
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear errors when the user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }

    // Update dynamic fields when the event type changes
    if (fieldName === "githubEventType") {
      const fields = GITHUB_TRIGGER_FIELDS_MAP[value || "issue_comment"];
      // setDynamicFields(fields.map((field) => `${field}`));
      setDynamicFields(fields.map((field) => `{{trigger.${field}}}`));

      // Update triggerName with the new githubEventType
      setTriggerName((prev) => {
        if (prev.githubEventType === value) {
          return prev; // No change, return previous state
        }
        return {
          ...prev,
          githubEventType: value,
        };
      });

      if (handleTriggerTypeChange !== undefined) {
        handleTriggerTypeChange(value);
      }
    } else {
      const fields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
      setDynamicFields(fields.map((field) => `${field}`));
    }
  };

  const validatePlaceholder = (value: string, allowedFields: string[]) => {
    const placeholders = value.match(/{{trigger\.([^}]+)}}/g) || [];
    return placeholders.every((placeholder) => {
      const key = placeholder.replace(/{{trigger\.([^}]+)}}/, "$1");
      return allowedFields.includes(key);
    });
  };

  const validateNumberOrPlaceholder = (value: string | undefined | null) => {
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedFormData = { ...formData };

    console.log("here#1");
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

      // Update triggerName only if the githubEventType has changed
      if (updatedFormData.githubEventType !== triggerName?.githubEventType) {
        setTriggerName((prev) => ({
          ...prev,
          githubEventType: updatedFormData.githubEventType,
        }));
      }
      // Validate placeholders and number/placeholder fields if githubEventType is present
      if (triggerData?.githubEventType || triggerName?.githubEventType) {
        allowedFields =
          GITHUB_TRIGGER_FIELDS_MAP[
            triggerData?.githubEventType || triggerName?.githubEventType
          ];
      }
    } else {
      allowedFields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
      if (
        updatedFormData.keywords !== undefined &&
        !updatedFormData.keywords?.length
      ) {
        setErrors({ keywords: "At least one keyword is required" });
        return;
      }
      if (updatedFormData.country !== undefined && !updatedFormData.country) {
        setErrors({ location: "Country is required" });
        return;
      }
    }

    console.log("here#2");
    // Check if proper dynamic fields are assigned
    for (const field of fields) {
      const value = updatedFormData[field.name];

      // Skip validation for fields that do not support placeholders
      if (field.name === "githubEventType" || field.name === "githubwebhook") {
        continue;
      }

      // Validate placeholders for fields that support them
      if (
        typeof value === "string" &&
        !validatePlaceholder(value, allowedFields)
      ) {
        setErrors((prev) => ({
          ...prev,
          [field.name]: `Invalid placeholder for ${field.name}. Allowed fields: ${allowedFields.join(", ")}`,
        }));
        toast.error("Invalid input field");
        return;
      }

      // Validate number/placeholder fields
      if (
        field.validation?.isNumberOrPlaceholder &&
        !validateNumberOrPlaceholder(value)
      ) {
        setErrors((prev) => ({
          ...prev,
          [field.name]: `Invalid value for ${field.name}. It must be a number or contain a valid placeholder.`,
        }));
        toast.error("Invalid input field");
        return;
      }
    }

    // Validate the amount field
    if (
      fields.some((obj) => obj.name.includes("Amount")) &&
      updatedFormData.Amount === ""
    ) {
      setErrors((prev) => ({
        ...prev,
        Amount: "Amount is required",
      }));
      toast.error("Amount is required");
      return;
    }

    // Replace placeholders with actual values
    const processedData = { ...updatedFormData };
    for (const key in processedData) {
      const value = processedData[key];

      // If the field is a number/placeholder field
      if (
        fields.find((f) => f.name === key)?.validation?.isNumberOrPlaceholder
      ) {
        if (typeof value === "string" && validateNumberOrPlaceholder(value)) {
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

    console.log("here#3");
    // Skip validation if schema is for github-webhook which is only a link
    if (!schema) {
      onSubmit(processedData);
      onClose();
      toast.success("Saved successfully!");
      return;
    }

    // Validate form data using Zod schema
    try {
      const validatedData = schema.parse(processedData);
      console.log("here#fin");
      onSubmit(validatedData);
      console.log("here#fin2");
      onClose();
      toast.success("Saved successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Map Zod errors to the errors state
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = `${err.message} ${err.path[0]}`;
        });
        setErrors(newErrors);
        toast.error("Please fix the errors before submitting.");
      } else {
        toast.error("Failed to save. Please try again.");
      }
    }
  };
  // Handle adding a trigger field to the active input
  const handleAddTriggerField = (field: string) => {
    if (activeInput) {
      const currentValue = formData[activeInput] || "";
      handleInputChange(activeInput, `${currentValue} {{trigger.${field}}}`);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success(`Link copied to clipboard!`);
  };

  // Generate the webhook URL based on the selected event type
  const generateWebhookUrl = () => {
    const eventType =
      triggerData?.githubEventType ||
      triggerName?.githubEventType ||
      "issue_comment";
    return `${HOOKS_URL}/github-webhook/${eventType}/${userId}/${zapId || ""}`;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const User = await api.get("/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserId(User.data.id);
    };
    fetchUser();
  }, [userId]);

  // Update dynamic fields based on the last saved trigger type
  useEffect(() => {
    let fields: string[] = [];
    if (triggerType === "github") {
      fields =
        GITHUB_TRIGGER_FIELDS_MAP[
          triggerData?.githubEventType ||
            triggerName?.githubEventType ||
            "issue_comment"
        ];
    } else if (triggerType === "linkedin") {
      fields = LINKEDIN_TRIGGER_FIELDS_MAP["linkedin"];
    }
    if (fields !== undefined) {
      setDynamicFields(fields.map((field) => `${field}`));
    }
  }, [triggerData, triggerName]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await axios.get(
          "https://countriesnow.space/api/v0.1/countries",
        );
        setCountries(response.data.data);
      } catch (error) {
        setCountryError("Failed to load countries");
        console.error("Country fetch error:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country) {
      debouncedFetchStates(formData.country);
    }
  }, [formData.country]);

  // Debounced fetch states when country changes
  const debouncedFetchStates = useDebounce(async (countryName: string) => {
    if (!countryName) return;

    try {
      setLoadingStates(true);
      const response = await axios.post(
        "https://countriesnow.space/api/v0.1/countries/states",
        {
          country: countryName,
        },
      );

      setStates(response.data.data.states || []);
      setStateError("");
    } catch (error) {
      setStateError("Failed to load states");
      console.error("State fetch error:", error);
    } finally {
      setLoadingStates(false);
    }
  }, 300);

  // Handle country change
  const handleCountryChange = (countryName: string) => {
    handleInputChange("country", countryName);
    handleInputChange("state", "");
    debouncedFetchStates(countryName);
  };

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
              value={formData[field.name] || ""}
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
                formData[field.name] ||
                (field.name === "githubEventType" ? "issue_comment" : "")
              }
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`mt-1 block w-full p-2 border rounded-md ${
                isDarkMode
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
            selected={formData[field.name] || []}
            onChange={(selected) => handleInputChange(field.name, selected)}
            label={field.label}
            required={field.required}
          />
        );
      case "tag-input":
        return (
          <TagInput
            key={field.name}
            tags={formData[field.name] || []}
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
                value={formData.country || ""}
                onChange={(e) => handleCountryChange(e.target.value)}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  isDarkMode
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
            {formData.country && (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="state"
                  className={isDarkMode ? "text-white" : "text-[#111827]"}
                >
                  State{" "}
                </Label>
                <select
                  id="state"
                  value={formData.state || ""}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className={`mt-1 block w-full p-2 border rounded-md ${
                    isDarkMode
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
