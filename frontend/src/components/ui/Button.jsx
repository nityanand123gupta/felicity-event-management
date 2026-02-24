import React from "react";

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md",
  secondary:
    "bg-gray-100 hover:bg-gray-200 text-gray-800",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  success:
    "bg-green-600 hover:bg-green-700 text-white shadow-sm",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}