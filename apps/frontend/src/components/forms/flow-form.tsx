import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/lib/types";
import { Button } from "../ui/button";
import Error from "../globals/form-error";
import { z } from "zod";
import toast from "react-hot-toast";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  schema: z.ZodSchema<any>;
  triggerData?: Record<string, any>;
  onClose: () => void;
}

function DynamicForm({
  fields,
  onSubmit,
  initialData,
  schema,
  triggerData,
  onClose,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData === undefined ? {} : initialData,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear errors when the user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data using Zod schema
    try {
      const validatedData = schema.parse(formData);
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
            {activeInput === field.name && (
              <div className="flex gap-2 flex-wrap">
                {Object.keys(triggerData || {}).map((key) => (
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
              value={formData[field.name] || ""}
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
