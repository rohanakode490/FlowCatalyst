import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FormComponent({ onSubmit, initialData }) {
  // State to manage form data
  const [formData, setFormData] = useState(initialData || {});

  // Sync internal state with initialData prop
  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pass the form data to the parent component
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Example: Dynamic form fields based on the webhook */}
      {Object.keys(formData).map((field) => (
        <div key={field}>
          <Label htmlFor={field}>{field}</Label>
          <Input
            id={field}
            name={field}
            value={formData[field]}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
      ))}

      {/* Submit button */}
      <Button type="submit" className="w-full">
        Save
      </Button>
    </form>
  );
}

export default FormComponent;
