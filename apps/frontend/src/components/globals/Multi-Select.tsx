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
      backgroundColor: isDarkMode ? "#1f2937" : "#fff",
      borderColor: isDarkMode ? "#374151" : "#d1d5db",
      color: isDarkMode ? "#fff" : "#111827",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#1f2937" : "#fff",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? isDarkMode
          ? "#374151"
          : "#d1d5db"
        : isDarkMode
          ? "#02081f"
          : "#f9fafb",
      color: isDarkMode ? "#fff" : "#505050",
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#374151" : "#e5e7eb",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: isDarkMode ? "#fff" : "#111827",
    }),
    input: (provided: any) => ({
      ...provided,
      color: isDarkMode ? "#fff" : "#111827",
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
