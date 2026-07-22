const Button = ({ 
  children, 
  onClick, 
  type = "button",
  variant = "primary", 
  size = "md",
  disabled = false,
  loading = false,
  icon = null
}) => {

  const variants = {
    primary:   "bg-blue-700 hover:bg-blue-800 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    outline:   "border border-blue-700 text-blue-700 hover:bg-blue-50",
  }

  const sizes = {
    sm:  "px-3 py-1.5 text-sm",
    md:  "px-4 py-2 text-sm",
    lg:  "px-6 py-3 text-base",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        flex items-center gap-2
        rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

export default Button