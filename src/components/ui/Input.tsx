"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      success,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const hasValue = props.value !== undefined && props.value !== "";
    const alwaysFloat =
      type === "date" || type === "time" || type === "color";
    const shouldFloat = focused || hasValue || alwaysFloat;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7e72] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              "input-dark peer",
              leftIcon && "pl-11",
              (rightIcon || isPassword) && "pr-11",
              label && "pt-6 pb-1",
              error && "!border-[#cf3a4a] focus:!border-[#cf3a4a] focus:!shadow-[0_0_0_3px_rgba(207,58,74,0.18)]",
              success && "!border-[#a8d966] focus:!border-[#a8d966] focus:!shadow-[0_0_0_3px_rgba(168,217,102,0.18)]",
              className
            )}
            placeholder={label ? " " : props.placeholder}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-4 transition-all duration-200 pointer-events-none",
                leftIcon && "left-11",
                shouldFloat
                  ? "top-1.5 text-[11px] tracking-wide uppercase text-[#9a9f93]"
                  : "top-1/2 -translate-y-1/2 text-[#6a6e64] text-base",
                !shouldFloat &&
                  "peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:tracking-wide peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:text-[#9a9f93] peer-[:not(:placeholder-shown)]:translate-y-0",
                !shouldFloat &&
                  "peer-[:-webkit-autofill]:top-1.5 peer-[:-webkit-autofill]:text-[11px] peer-[:-webkit-autofill]:tracking-wide peer-[:-webkit-autofill]:uppercase peer-[:-webkit-autofill]:text-[#9a9f93] peer-[:-webkit-autofill]:translate-y-0"
              )}
            >
              {label}
            </label>
          )}
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7e72] hover:text-[#ebf1e2] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7e72] pointer-events-none">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error && (
          <span className="text-[#cf3a4a] text-xs pl-1 animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
