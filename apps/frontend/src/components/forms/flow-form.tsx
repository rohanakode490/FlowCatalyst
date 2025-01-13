import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/lib/types";
import { Button } from "../ui/button";
import Error from "../globals/form-error";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(schema), // Integrate Zod validation
    defaultValues: initialData,
  });

  const [activeInput, setActiveInput] = useState<string | null>(null);

  const onFormSubmit = (data: Record<string, any>) => {
    try {
      onSubmit(data); // Call the onSubmit function
      onClose();
      toast.success("Saved successfully!"); // Show success toast
    } catch (error) {
      toast.error("Failed to save. Please try again."); // Show error toast
    }
  };

  // Handle adding a trigger field to the active input
  const handleAddTriggerField = (field: string) => {
    if (activeInput) {
      const currentValue = watch(activeInput) || "";
      setValue(activeInput, `${currentValue} {{trigger.${field}}}`);
    }
  };
  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-4 overflow-y-auto"
    >
      {fields.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.type === "text" || field.type === "number" ? (
            <div className="flex flex-col gap-2">
              <Input
                type={field.type}
                id={field.name}
                {...register(field.name)}
                placeholder={field.placeholder}
                className="mt-1 flex-1"
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
          ) : field.type === "select" ? (
            <select
              id={field.name}
              {...register(field.name)} // Register the field with react-hook-form
              className="mt-1 block w-full p-2 border rounded-md"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <Input
              type="checkbox"
              id={field.name}
              {...register(field.name)} // Register the field with react-hook-form
              className="mt-1"
            />
          ) : null}
          {errors[field.name] && (
            <Error className="mt-2" errorMessage={errors[field.name].message} />
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
