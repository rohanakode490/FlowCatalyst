"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/lib/types";
import { Button } from "../ui/button";
import Error from "../globals/form-error";
import { z } from "zod";
import toast from "react-hot-toast";
import { CopyIcon } from "lucide-react";
import { HOOKS_URL } from "@/lib/config";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { GITHUB_TRIGGER_FIELDS_MAP } from "@/lib/constant";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  schema: z.ZodSchema<any>;
  triggerData?: Record<string, any>;
  triggerName?: Record<string, any>;
  setTriggerName: Dispatch<SetStateAction<Record<string, any>>>;
  onClose: () => void;
  handleTriggerTypeChange?: (trigger: string) => Promise<void>;
}

function DynamicForm({
  fields,
  onSubmit,
  initialData,
  schema,
  triggerData,
  triggerName,
  setTriggerName,
  onClose,
  handleTriggerTypeChange,
}: DynamicFormProps) {
  const params = useParams();
  const zapId = params.zapId as string;
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data = { ...(initialData || {}) };

    // Check if triggerName or triggerData has githubEventType
    if (
      triggerName?.githubEventType !== undefined ||
      triggerData?.githubEventType !== undefined
    ) {
      // Set the default value only if githubEventType is not already set in initialData
      if (data.githubEventType === undefined || data.githubEventType === "") {
        data.githubEventType = "issue_comment"; // Default value
      }
    }
    // Provide a default value for the amount field
    if (data.Amount === undefined || data.Amount === "") {
      data.Amount = "0"; // Default value for amount
    }

    return data;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [dynamicFields, setDynamicFields] = useState<string[]>([]);

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

    // setFormData((prev) => ({ ...prev, [fieldName]: value }));
    const updatedFormData = { ...formData };
    // Check if triggerName or triggerData has githubEventType
    if (
      triggerName?.githubEventType !== undefined ||
      triggerData?.githubEventType !== undefined
    ) {
      // Ensure githubEventType has a default value if it's empty
      if (
        updatedFormData.githubEventType === undefined ||
        updatedFormData.githubEventType === ""
      ) {
        updatedFormData.githubEventType = "issue_comment"; // Default value
      }
    }

    // Update triggerName only if the githubEventType has changed
    if (updatedFormData.githubEventType !== triggerName?.githubEventType) {
      setTriggerName((prev) => ({
        ...prev,
        githubEventType: updatedFormData.githubEventType,
      }));
    }

    // Validate the amount field
    if (updatedFormData.Amount === undefined || updatedFormData.Amount === "") {
      setErrors((prev) => ({
        ...prev,
        Amount: "Amount is required",
      }));
      toast.error("Amount is required");
      return;
    }

    // Validate placeholders and number/placeholder fields if githubEventType is present
    if (triggerData?.githubEventType || triggerName?.githubEventType) {
      const allowedFields =
        GITHUB_TRIGGER_FIELDS_MAP[
          triggerData?.githubEventType || triggerName?.githubEventType
        ];

      for (const field of fields) {
        const value = updatedFormData[field.name];

        // Skip validation for fields that do not support placeholders
        if (
          field.name === "githubEventType" ||
          field.name === "githubwebhook"
        ) {
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

        // Validate number/placeholder fields (e.g., amount for Solana action)
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
    }

    // Replace placeholders with actual values
    const processedData = { ...updatedFormData };
    for (const key in processedData) {
      const value = processedData[key];

      // If the field is a number/placeholder field, handle it appropriately
      if (
        fields.find((f) => f.name === key)?.validation?.isNumberOrPlaceholder
      ) {
        if (typeof value === "string" && validateNumberOrPlaceholder(value)) {
          // If the value contains a placeholder, save it as-is
          processedData[key] = value;
        } else if (!isNaN(parseFloat(value))) {
          processedData[key] = value;
        } else {
          // If the value is invalid, set it to 0 (or handle it as needed)
          processedData[key] = "0";
        }
      }
    }

    // Skip validation if schema is for github-webhook which is only a link
    if (!schema) {
      onSubmit(processedData); // Submit the form data without validation
      onClose();
      toast.success("Saved successfully!");
      return;
    }

    // Validate form data using Zod schema
    try {
      const validatedData = schema.parse(processedData);
      onSubmit(validatedData); // Submit the validated data
      onClose();
      toast.success("Saved successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Map Zod errors to the errors state
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
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

  // Replace placeholders with actual values from the webhook
  const replacePlaceholders = (template: string, data: Record<string, any>) => {
    return template.replace(/{{trigger\.([^}]+)}}/g, (_, key) => {
      const value = key.split(".").reduce((obj: any, k: any) => obj?.[k], data);
      return value || "";
    });
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
    if (
      (triggerData?.githubEventType && triggerData.githubEventType !== "") ||
      triggerName?.githubEventType !== ""
    ) {
      const fields =
        GITHUB_TRIGGER_FIELDS_MAP[
          triggerData?.githubEventType ||
            triggerName?.githubEventType ||
            "issue_comment"
        ];

      // setTriggerName((prev) => ({
      //   ...prev,
      //   githubEventType:
      //     triggerData?.githubEventType ||
      //     triggerName?.githubEventType ||
      //     "issue_comment",
      // }));
      setDynamicFields(fields.map((field) => `${field}`));
    }
  }, [triggerData, triggerName]);

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
            <Label htmlFor={field.name}>
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
              className="mt-1 block w-full p-2 border rounded-md"
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
