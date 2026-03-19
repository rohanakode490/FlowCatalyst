"use client";

import React from "react";
import Select, { MultiValue } from "react-select";
import { useTheme } from "next-themes";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  label,
  required,
}: MultiSelectProps) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const handleChange = (
    newValue: MultiValue<{ value: string; label: string }>,
  ) => {
    onChange(
      newValue.map((option: { value: string; label: string }) => option.value),
    );
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--input)",
      borderColor: "var(--border)",
      color: "var(--foreground)",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--popover)",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "var(--accent)"
        : "transparent",
      color: state.isFocused ? "var(--accent-foreground)" : "var(--foreground)",
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--secondary)",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "var(--secondary-foreground)",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "var(--foreground)",
    }),
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Select
        isMulti
        options={options}
        value={options.filter((option) => selected.includes(option.value))}
        onChange={handleChange}
        placeholder={placeholder || "Select options..."}
        className="react-select-container"
        classNamePrefix="react-select"
        styles={customStyles}
      />
    </div>
  );
};
