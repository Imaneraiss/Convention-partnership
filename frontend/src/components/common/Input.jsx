export default function Input({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text',
  placeholder = '',
  required = false,
  readOnly = false,
  className = '',
  error = '',
  ...props 
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        className={`
          w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 
          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${readOnly ? 'bg-gray-50 cursor-default' : 'bg-white'}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}