"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "next-themes";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const TagInput = ({
  tags,
  onTagsChange,
  placeholder,
  label,
  required,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (["Enter", "Tab", ","].includes(e.key)) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
        setInputValue("");
      }
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`flex flex-wrap gap-2 p-2 border rounded-md ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-300"
        }`}
      >
        {tags.map((tag, index) => (
          <div
            key={index}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded-full ${
              isDarkMode
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className={`${
                isDarkMode
                  ? "text-gray-400 hover:text-red-400"
                  : "text-gray-500 hover:text-red-500"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type and press Enter..."}
          className={`flex-1 outline-none bg-transparent ${
            isDarkMode ? "text-gray-200" : "text-gray-900"
          }`}
          style={{
            color: isDarkMode ? "#e5e7eb" : "#111827",
            caretColor: isDarkMode ? "#e5e7eb" : "#111827",
          }}
        />
      </div>
    </div>
  );
};
