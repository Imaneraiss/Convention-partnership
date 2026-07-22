const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md"
}) => {

  if (!isOpen) return null

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl"
  }

  return (
    <>
      {/* Overlay sombre derrière */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Fenêtre modale */}
      <div className={`
        fixed top-1/2 left-1/2 
        -translate-x-1/2 -translate-y-1/2
        ${sizes[size]}
        w-full bg-white rounded-xl shadow-xl
        z-50 p-6
      `}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div>
          {children}
        </div>

      </div>
    </>
  )
}

export default Modal