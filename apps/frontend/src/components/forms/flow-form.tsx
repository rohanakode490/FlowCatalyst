import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/lib/types";
import { Button } from "../ui/button";
import Error from "../globals/form-error";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  schema: z.ZodSchema<any>;
}

function DynamicForm({
  fields,
  onSubmit,
  initialData,
  schema,
}: DynamicFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema), // Integrate Zod validation
    defaultValues: initialData,
  });
  const onFormSubmit = (data: Record<string, any>) => {
    onSubmit(data);
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
            <Input
              type={field.type}
              id={field.name}
              {...register(field.name)} // Register the field with react-hook-form
              placeholder={field.placeholder}
              className="mt-1 focus:ring-2 focus:ring-white focus:border-white"
            />
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
