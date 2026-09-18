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
  Key
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

export default function GestionComptes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'charge_partenariat',
    telephone: '',
    actif: true
  });
  
  const [passwordData, setPasswordData] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation_mot_de_passe: ''
  });

  // Récupération des utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError(t('users.loadError'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage
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

  // Statistiques
  const stats = {
    total: users.length,
    charge_partenariat: users.filter(u => u.role === 'charge_partenariat').length,
    secretaire_generale: users.filter(u => u.role === 'secretaire_generale').length,
    president: users.filter(u => u.role === 'president').length,
    actifs: users.filter(u => u.actif).length,
    inactifs: users.filter(u => !u.actif).length
  };

  // Gestion des utilisateurs
  const handleCreateUser = async () => {
    if (formData.nom && formData.prenom && formData.email && formData.password) {
      try {
        await createUser(formData);
        fetchUsers();
        resetForm();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Erreur lors de la création:', error);
        setError(t('users.createError'));
      }
    }
  };

  const handleUpdateUser = async () => {
    if (editingUser && formData.nom && formData.prenom && formData.email) {
      try {
        const updateData = { ...formData };
        delete updateData.password;
        await updateUser(editingUser.id, updateData);
        fetchUsers();
        resetForm();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        setError(t('users.updateError'));
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm(t('users.confirmDelete'))) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError(t('users.deleteError'));
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
        ancien_mot_de_passe: passwordData.ancien_mot_de_passe,
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
      console.error('Erreur lors du changement de mot de passe:', error);
      alert(t('users.passwordChangeError'));
    }
  };

  // Ouvrir modal d'édition
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      password: '',
      role: user.role || 'charge_partenariat',
      telephone: user.telephone || '',
      actif: user.actif !== undefined ? user.actif : true
    });
    setIsModalOpen(true);
  };

  // Ouvrir modal de création
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'charge_partenariat',
      telephone: '',
      actif: true
    });
    setIsModalOpen(true);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'charge_partenariat',
      telephone: '',
      actif: true
    });
    setEditingUser(null);
  };

  // Rôle traduit
  const getRoleLabel = (role) => {
    const roleKeys = {
      admin: 'ADMIN',
      charge_partenariat: 'CHARGE',
      secretaire_generale: 'SG',
      president: 'PRESIDENT'
    };
    return t(`roles.${roleKeys[role] || role.toUpperCase()}`);
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

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('common.total')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.charge_partenariat}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('users.chargePartenariat')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.secretaire_generale}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('users.secretaireGenerale')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.actifs}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('users.active')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-red-500">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.inactifs}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('users.inactive')}</p>
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
                { value: 'charge_partenariat', label: t('roles.CHARGE') },
                { value: 'secretaire_generale', label: t('roles.SG') },
                { value: 'president', label: t('roles.PRESIDENT') }
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
            {users.length === 0 && (
              <Button className="mt-4" onClick={openCreateModal}>
                {t('users.createButton')}
              </Button>
            )}
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
                      <User size={16} className="sm:hidden text-blue-600" />
                      <User size={20} className="hidden sm:block text-blue-600" />
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
                  {user.date_creation && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar size={12} className="flex-shrink-0" />
                      <span>{t('users.createdOn')} {new Date(user.date_creation).toLocaleDateString()}</span>
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
                    {t('users.password')}
                  </Button>
                  {user.role !== 'admin' && (
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

      {/* Compteur */}
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
              placeholder={t('users.namePlaceholder')}
              required
            />
            <Input
              label={t('users.firstName')}
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              placeholder={t('users.firstNamePlaceholder')}
              required
            />
          </div>

          <Input
            label={t('users.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('users.emailPlaceholder')}
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
                { value: 'charge_partenariat', label: t('roles.CHARGE') },
                { value: 'secretaire_generale', label: t('roles.SG') },
                { value: 'president', label: t('roles.PRESIDENT') }
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
            placeholder={t('users.phonePlaceholder')}
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button onClick={editingUser ? handleUpdateUser : handleCreateUser} className="w-full sm:w-auto">
              {editingUser ? t('users.update') : t('users.createButton')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key size={20} />
            {t('auth.changePassword')}
          </h3>

          <p className="text-sm text-gray-500">
            {t('users.user')}: {editingUser?.prenom} {editingUser?.nom}
          </p>

          <Input
            label={t('users.oldPassword')}
            type="password"
            value={passwordData.ancien_mot_de_passe}
            onChange={(e) => setPasswordData({ ...passwordData, ancien_mot_de_passe: e.target.value })}
            placeholder="••••••••"
            required
          />

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

          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {t('users.passwordHint')}
            </p>
          </div>

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