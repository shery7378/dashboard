"use client";

import React, { useId, forwardRef } from "react";

export interface AuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, error, className = "", inputClassName = "", id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
        className="mb-[9px] inline-block text-base font-normal text-[#000000]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={`email-input w-full px-4 py-4.5 !bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0 focus:border-0 ${inputClassName}`.trim()}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 text-left">{error}</p>
      )}
    </div>
  );
});

export default AuthInput;
