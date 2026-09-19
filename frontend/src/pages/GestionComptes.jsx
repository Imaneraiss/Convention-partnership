import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Shield
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  updatePassword,
  deleteUser 
} from '../services/userService';

// ═══════════════════════════════════════════════════════════
// MAPPING ROLE : Frontend ⟷ Backend
// ═══════════════════════════════════════════════════════════
// Frontend utilise des noms longs (charge_partenariat)
// Backend utilise des noms courts (CHARGE)
const ROLE_MAP_TO_BACKEND = {
  'charge_partenariat': 'CHARGE',
  'secretaire_generale': 'SG',
  'president': 'PRESIDENT',
  'admin': 'ADMIN'
};

const ROLE_MAP_FROM_BACKEND = {
  'CHARGE': 'charge_partenariat',
  'SG': 'secretaire_generale',
  'PRESIDENT': 'president',
  'ADMIN': 'admin'
};

const ROLES = [
  { value: 'charge_partenariat', label: 'Chargé de partenariat' },
  { value: 'secretaire_generale', label: 'Secrétaire générale' },
  { value: 'president', label: 'Président' },
  { value: 'admin', label: 'Administrateur' }
];

export default function GestionComptes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'charge_partenariat',
    telephone: '',
    actif: true,
    is_admin: false
  });
  
  const [passwordData, setPasswordData] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation_mot_de_passe: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers();
      // ✅ Convertir les rôles backend → frontend pour l'affichage
      const usersFormatted = (response.data || []).map(u => ({
        ...u,
        role: ROLE_MAP_FROM_BACKEND[u.role] || u.role
      }));
      setUsers(usersFormatted);
    } catch (error) {
      console.error('Erreur:', error);
      setError(t('users.loadError'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'actif' ? user.actif : !user.actif;
      if (isActive !== (statusFilter === 'actif')) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const inNom = user.nom?.toLowerCase().includes(s);
      const inPrenom = user.prenom?.toLowerCase().includes(s);
      const inEmail = user.email?.toLowerCase().includes(s);
      if (!inNom && !inPrenom && !inEmail) return false;
    }
    return true;
  });

  const stats = {
    total: users.length,
    charge_partenariat: users.filter(u => u.role === 'charge_partenariat').length,
    secretaire_generale: users.filter(u => u.role === 'secretaire_generale').length,
    president: users.filter(u => u.role === 'president').length,
    admin: users.filter(u => u.role === 'admin').length,
    actifs: users.filter(u => u.actif).length,
    inactifs: users.filter(u => !u.actif).length
  };

  // ═══════════════════════════════════════════════════════════
  // CRÉATION - Avec transformation des données
  // ═══════════════════════════════════════════════════════════
  const handleCreateUser = async () => {
    if (!formData.nom || !formData.email || !formData.password) {
      setError("Nom, email et mot de passe sont obligatoires");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // ✅ TRANSFORMER les données pour le backend
      const payload = {
        nom: formData.nom,
        prenom: formData.prenom || null,
        email: formData.email,
        mot_de_passe: formData.password,           // ⬅️ Renommer
        role: ROLE_MAP_TO_BACKEND[formData.role],  // ⬅️ charge_partenariat → CHARGE
        is_admin: formData.is_admin,
        telephone: formData.telephone || null,
        actif: formData.actif
      };
      
      console.log('📤 Payload création:', payload);
      
      await createUser(payload);
      await fetchUsers();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur création:', error);
      setError(error.response?.data?.detail || t('users.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // MISE À JOUR
  // ═══════════════════════════════════════════════════════════
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        nom: formData.nom,
        prenom: formData.prenom || null,
        email: formData.email,
        role: ROLE_MAP_TO_BACKEND[formData.role],  // ⬅️ Transformer
        is_admin: formData.is_admin,
        telephone: formData.telephone || null,
        actif: formData.actif
        // ⚠️ PAS de mot de passe ici
      };
      
      console.log('📤 Payload mise à jour:', payload);
      
      await updateUser(editingUser.id, payload);
      await fetchUsers();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setError(error.response?.data?.detail || t('users.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm(t('users.confirmDelete'))) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Erreur suppression:', error);
        setError(error.response?.data?.detail || t('users.deleteError'));
      }
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.nouveau_mot_de_passe !== passwordData.confirmation_mot_de_passe) {
      alert(t('auth.passwordMismatch'));
      return;
    }
    if (passwordData.nouveau_mot_de_passe.length < 8) {
      alert(t('users.passwordTooShort'));
      return;
    }
    try {
      await updatePassword(editingUser.id, {
        nouveau_mot_de_passe: passwordData.nouveau_mot_de_passe
      });
      setIsPasswordModalOpen(false);
      setPasswordData({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmation_mot_de_passe: ''
      });
      alert(t('users.passwordChanged'));
    } catch (error) {
      console.error('Erreur mot de passe:', error);
      alert(t('users.passwordChangeError'));
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      password: '',
      role: user.role || 'charge_partenariat',
      telephone: user.telephone || '',
      actif: user.actif !== undefined ? user.actif : true,
      is_admin: user.is_admin || false
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'charge_partenariat',
      telephone: '',
      actif: true,
      is_admin: false
    });
    setError(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'charge_partenariat',
      telephone: '',
      actif: true,
      is_admin: false
    });
    setEditingUser(null);
    setError(null);
  };

  // ═══════════════════════════════════════════════════════════
  // Affichage - Rôle traduit
  // ═══════════════════════════════════════════════════════════
  const getRoleLabel = (role) => {
    const labels = {
      'charge_partenariat': 'Chargé de partenariat',
      'secretaire_generale': 'Secrétaire générale',
      'president': 'Président',
      'admin': 'Administrateur'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      charge_partenariat: 'bg-blue-100 text-blue-800',
      secretaire_generale: 'bg-green-100 text-green-800',
      president: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('users.loadingUsers')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl text-gray-500 flex items-center gap-2">
            {t('users.pageTitle')}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="secondary" 
            onClick={fetchUsers}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} />
            {t('users.refresh')}
          </Button>
          <Button 
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('users.create')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('common.total')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.charge_partenariat}</p>
          <p className="text-xs sm:text-sm text-gray-500">Chargés</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.secretaire_generale}</p>
          <p className="text-xs sm:text-sm text-gray-500">Sec. Gén.</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-orange-500">
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.president}</p>
          <p className="text-xs sm:text-sm text-gray-500">Présidents</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-purple-500">
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.admin}</p>
          <p className="text-xs sm:text-sm text-gray-500">Admins</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.actifs}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('users.active')}</p>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="w-full">
            <Input
              placeholder={t('users.searchUser')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: t('users.allRoles') },
                { value: 'charge_partenariat', label: 'Chargé de partenariat' },
                { value: 'secretaire_generale', label: 'Secrétaire générale' },
                { value: 'president', label: 'Président' },
                { value: 'admin', label: 'Administrateur' }
              ]}
              className="w-full sm:w-48"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: t('users.allStatuses') },
                { value: 'actif', label: t('users.active') },
                { value: 'inactif', label: t('users.inactive') }
              ]}
              className="w-full sm:w-40"
            />
            {(roleFilter !== 'all' || statusFilter !== 'all' || search) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <X size={16} />
                {t('common.reset')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Liste des utilisateurs */}
      {filteredUsers.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">{t('users.noUsers')}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {users.length === 0 
                ? t('users.noUsersYet')
                : t('users.noMatchingUsers')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {user.is_admin ? (
                        <Shield size={16} className="text-purple-600" />
                      ) : (
                        <User size={16} className="text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {user.prenom} {user.nom}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {user.actif ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {t('users.active')}
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {t('users.inactive')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{user.email}</span>
                  </div>
                  {user.telephone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{user.telephone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditModal(user)}
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Edit size={14} />
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingUser(user);
                      setPasswordData({
                        ancien_mot_de_passe: '',
                        nouveau_mot_de_passe: '',
                        confirmation_mot_de_passe: ''
                      });
                      setIsPasswordModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Key size={14} />
                  </Button>
                  {!user.is_admin && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex items-center gap-1 ml-auto"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredUsers.length > 0 && (
        <p className="text-sm text-gray-500">
          {filteredUsers.length} {t('users.usersDisplayed')}
        </p>
      )}

      {/* Modal de création/édition */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }}>
        <div className="p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <User size={20} />
            {editingUser ? t('users.editUser') : t('users.newUser')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label={t('users.name')}
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Dupont"
              required
            />
            <Input
              label={t('users.firstName')}
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              placeholder="Jean"
            />
          </div>

          <Input
            label={t('users.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jean.dupont@um5.ac.ma"
            required
          />

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label={t('users.role')}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'charge_partenariat', label: 'Chargé de partenariat' },
                { value: 'secretaire_generale', label: 'Secrétaire générale' },
                { value: 'president', label: 'Président' },
                { value: 'admin', label: 'Administrateur' }
              ]}
            />
            <Select
              label={t('users.status')}
              value={formData.actif ? 'actif' : 'inactif'}
              onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'actif' })}
              options={[
                { value: 'actif', label: t('users.active') },
                { value: 'inactif', label: t('users.inactive') }
              ]}
            />
          </div>

          <Input
            label={t('users.phoneOptional')}
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="06 12 34 56 78"
          />

          {/* ✅ CASE À COCHER ADMIN */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Administrateur
                  </p>
                  <p className="text-xs text-purple-700">
                    Accès complet à toutes les fonctionnalités
                  </p>
                </div>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={editingUser ? handleUpdateUser : handleCreateUser} 
              className="w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting 
                ? 'Enregistrement...' 
                : (editingUser ? t('users.update') : t('users.createButton'))
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key size={20} />
            {t('auth.changePassword')}
          </h3>

          <p className="text-sm text-gray-500">
            {t('users.user')}: {editingUser?.prenom} {editingUser?.nom}
          </p>

          <Input
            label={t('auth.newPassword')}
            type="password"
            value={passwordData.nouveau_mot_de_passe}
            onChange={(e) => setPasswordData({ ...passwordData, nouveau_mot_de_passe: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Input
            label={t('auth.confirmPassword')}
            type="password"
            value={passwordData.confirmation_mot_de_passe}
            onChange={(e) => setPasswordData({ ...passwordData, confirmation_mot_de_passe: e.target.value })}
            placeholder="••••••••"
            required
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdatePassword} className="w-full sm:w-auto">
              {t('auth.changePassword')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}