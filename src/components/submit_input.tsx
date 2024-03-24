"use client";

import React, { useId, useCallback } from "react";

import { buttonClasses } from "./button";
import clsx from "clsx";

interface SubmitInputProps {
  label: string;
  placeholder?: string;
  submitBtn: string;
  onSubmit: (val: string) => void;
  disabled?: boolean;
}

export default function SubmitInput({
  label,
  placeholder,
  submitBtn,
  onSubmit,
  disabled,
}: SubmitInputProps) {
  const elmId = useId();

  const onFormSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      // skip if disabled
      if (disabled) {
        return;
      }
      const target = e.target as typeof e.target & {
        submit_value: { value: string };
      };

      const val = target.submit_value.value;
      onSubmit(val);
      target.submit_value.value = "";
    },
    [onSubmit, disabled],
  );

  return (
    <form onSubmit={onFormSubmit}>
      <label htmlFor={elmId} className="sr-only">
        {label}
      </label>
      <div className="flex flex-row items-stretch">
        <input
          type="text"
          id={elmId}
          name="submit_value"
          placeholder={placeholder ?? label}
          className="rounded-s-lg  border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className={clsx(
            buttonClasses.base,
            buttonClasses.primary,
            "rounded-e-lg",
          )}
          disabled={disabled}
        >
          {submitBtn}
        </button>
      </div>
    </form>
  );
}
