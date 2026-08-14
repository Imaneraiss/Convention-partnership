import { useState, useRef } from 'react';
import { UploadCloud, Download, FileText } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';

export default function BudgetTab({ readOnly, initialBudget = null, onChange }) {
  const [budget, setBudget] = useState(initialBudget || {
    modalitePaiement: '',
    montantTotal: 0,
    montantRecu: 0,
    montantDepense: 0,
    justificatifs: [],
    commentaire: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const updateBudget = (newBudget) => {
    setBudget(newBudget);
    if (onChange) onChange(newBudget);
  };

  const handleFileUpload = (file) => {
    if (file) {
      const newBudget = {
        ...budget,
        justificatifs: [...(budget.justificatifs || []), { 
          nom: file.name, 
          uploadDate: new Date().toISOString().split('T')[0] 
        }]
      };
      updateBudget(newBudget);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const removeJustificatif = (index) => {
    const newBudget = {
      ...budget,
      justificatifs: (budget.justificatifs || []).filter((_, i) => i !== index)
    };
    updateBudget(newBudget);
  };

  const totalRestant = (budget.montantTotal || 0) - (budget.montantRecu || 0);
  const pourcentageRecu = budget.montantTotal > 0 ? (budget.montantRecu / budget.montantTotal) * 100 : 0;

  const getStatutBudget = () => {
    if (budget.montantTotal === 0) return { label: '  Non défini', color: 'text-gray-600' };
    if (pourcentageRecu === 100) return { label: '✅ Reçu intégralement', color: 'text-green-600' };
    if (pourcentageRecu >= 50) return { label: '🟡 Partiellement reçu', color: 'text-yellow-600' };
    if (pourcentageRecu > 0) return { label: '🟠 En cours de réception', color: 'text-orange-600' };
    return { label: '🔴 Non reçu', color: 'text-red-600' };
  };

  const statut = getStatutBudget();

  return (
    <div className="space-y-6">
      {/* Modalités de paiement */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Modalités de paiement</h3>
        {readOnly ? (
          <p className="text-gray-900">{budget.modalitePaiement || 'Non définies'}</p>
        ) : (
          <Input
            value={budget.modalitePaiement}
            onChange={(e) => updateBudget({ ...budget, modalitePaiement: e.target.value })}
            placeholder="Ex: Versement annuel en 2 tranches"
          />
        )}
      </Card>

      {/* Montants */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Montant total</p>
          <p className="text-xl font-bold text-gray-900">
            {(budget.montantTotal || 0).toLocaleString()} DH
          </p>
          {!readOnly && (
            <Input
              type="number"
              value={budget.montantTotal || 0}
              onChange={(e) => updateBudget({ ...budget, montantTotal: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
          )}
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Montant reçu</p>
          <p className="text-xl font-bold text-green-600">
            {(budget.montantRecu || 0).toLocaleString()} DH
          </p>
          {!readOnly && (
            <Input
              type="number"
              value={budget.montantRecu || 0}
              onChange={(e) => updateBudget({ ...budget, montantRecu: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
          )}
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Montant dépensé</p>
          <p className="text-xl font-bold text-orange-600">
            {(budget.montantDepense || 0).toLocaleString()} DH
          </p>
          {!readOnly && (
            <Input
              type="number"
              value={budget.montantDepense || 0}
              onChange={(e) => updateBudget({ ...budget, montantDepense: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
          )}
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Reste à payer</p>
          <p className="text-xl font-bold text-red-600">
            {totalRestant.toLocaleString()} DH
          </p>
          <p className={`text-sm font-medium ${statut.color}`}>
            {statut.label}
          </p>
        </Card>
      </div>

      {/* Justificatifs */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FileText size={16} />
          Justificatifs
        </h3>

        {/* Liste des justificatifs */}
        {(budget.justificatifs || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {(budget.justificatifs || []).map((j, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50  rounded">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-700">{j.nom}</span>
                  <span className="text-xs text-gray-400">{j.uploadDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Download size={14} />
                    Télécharger
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeJustificatif(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zone Drag & Drop NATIVE sans react-dropzone */}
        {!readOnly && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed  rounded p-6 text-center cursor-pointer transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
            `}
          >
            <UploadCloud className="mx-auto text-gray-400" size={32} />
            <p className="mt-2 text-sm text-gray-600">
              {dragActive ? 'Déposez le fichier ici' : 'Glissez-déposez un justificatif'}
            </p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG acceptés</p>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
            />
          </div>
        )}
      </Card>

      {/* Commentaire */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Commentaire service financier
        </h3>
        <Textarea
          value={budget.commentaire || ''}
          onChange={(e) => updateBudget({ ...budget, commentaire: e.target.value })}
          readOnly={readOnly}
          rows={3}
          placeholder="Observations du service financier..."
        />
      </Card>
    </div>
  );
}