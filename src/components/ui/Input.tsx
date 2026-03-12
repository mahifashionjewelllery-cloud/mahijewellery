'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type: originalType, label, error, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const isPassword = originalType === "password"
        const type = isPassword ? (showPassword ? "text" : "password") : originalType

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-emerald-900 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-sm border border-emerald-900/20 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                            isPassword && "pr-10",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-900 transition-colors focus:outline-none"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
