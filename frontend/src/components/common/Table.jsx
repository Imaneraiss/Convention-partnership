import Badge from "./Badge"
import Button from "./Button"

const Table = ({ 
  columns, 
  data, 
  onView,
  onEdit,
  onDelete,
  loading = false
}) => {

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune convention trouvée
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        
        {/* Header */}
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-100">
          {data.map((row, index) => (
            <tr 
              key={row.id || index} 
              className="hover:bg-gray-50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.key === "statut" ? (
                    <Badge 
                      label={row[col.key]} 
                      variant={
                        row[col.key] === "EN_COURS" ? "active" :
                        row[col.key] === "EXPIREE" ? "expired" :
                        row[col.key] === "RENOUVELEE" ? "renewed" : "default"
                      }
                    />
                  ) : (
                    row[col.key] || "—"
                  )}
                </td>
              ))}

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {onView && (
                    <button 
                      onClick={() => onView(row)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Voir"
                    >
                      👁️
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(row)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(row)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )
}

export default Table