export default function Select({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [],
  placeholder = '',
  required = false,
  readOnly = false,
  className = '',
  error = ''
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        disabled={readOnly}
        className={`
          w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${readOnly ? 'bg-gray-50 cursor-default' : 'bg-white'}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      >
        <option value="">{placeholder || 'Sélectionner...'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}