const Badge = ({ 
  label, 
  variant = "default" 
}) => {

  const variants = {
    // Statuts convention
    active:    "bg-green-100 text-green-800",
    expired:   "bg-red-100 text-red-800",
    renewed:   "bg-blue-100 text-blue-800",
    
    default:   "bg-gray-100 text-gray-600",
  }

  return (
    <span className={`
      ${variants[variant]}
      px-2.5 py-0.5
      rounded-full
      text-xs font-medium
      inline-block
    `}>
      {label}
    </span>
  )
}

export default Badge