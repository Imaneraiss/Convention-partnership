import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Rôles disponibles (Admin est réservé, non affiché)
const ROLES = [
  { value: 'charge_partenariat', label: 'Chargé de partenariat' },
  { value: 'secretaire_generale', label: 'Secrétaire générale' },
  { value: 'president', label: 'Président' }
];

export default function GestionComptes() {
  const navigate = useNavigate();
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
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
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
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.nouveau_mot_de_passe !== passwordData.confirmation_mot_de_passe) {
      alert('Les mots de passe ne correspondent pas');
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
      alert('Mot de passe modifié avec succès');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
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

  // Rôle en français
  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrateur',
      charge_partenariat: 'Chargé de partenariat',
      secretaire_generale: 'Secrétaire générale',
      president: 'Président'
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
        <div className="text-gray-500">Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl  text-gray-500 flex items-center gap-2">
            Gérez les utilisateurs et leurs permissions
          </h1>
         
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={fetchUsers}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Rafraîchir
          </Button>
          <Button 
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.charge_partenariat}</p>
          <p className="text-sm text-gray-500">Chargés de partenariat</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.secretaire_generale}</p>
          <p className="text-sm text-gray-500">Secrétaires générales</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
          <p className="text-sm text-gray-500">Actifs</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.inactifs}</p>
          <p className="text-sm text-gray-500">Inactifs</p>
        </Card>
      </div>



      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les rôles' },
                { value: 'charge_partenariat', label: 'Chargé de partenariat' },
                { value: 'secretaire_generale', label: 'Secrétaire générale' },
                { value: 'president', label: 'Président' }
              ]}
              className="w-48"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' }
              ]}
              className="w-40"
            />
            {(roleFilter !== 'all' || statusFilter !== 'all' || search) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Liste des utilisateurs */}
      {filteredUsers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Aucun utilisateur</h3>
            <p className="text-sm text-gray-500 mt-1">
              {users.length === 0 
                ? 'Aucun utilisateur n\'a été créé pour le moment.'
                : 'Aucun utilisateur ne correspond à vos filtres.'}
            </p>
            {users.length === 0 && (
              <Button className="mt-4" onClick={openCreateModal}>
                Créer un utilisateur
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {user.prenom} {user.nom}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.actif ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Actif
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Inactif
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.telephone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="flex-shrink-0" />
                      <span>{user.telephone}</span>
                    </div>
                  )}
                  {user.date_creation && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar size={12} className="flex-shrink-0" />
                      <span>Créé le {new Date(user.date_creation).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditModal(user)}
                    className="flex items-center gap-1"
                  >
                    <Edit size={14} />
                    Modifier
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
                    className="flex items-center gap-1"
                  >
                    <Key size={14} />
                    Mot de passe
                  </Button>
                  {user.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex items-center gap-1"
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
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Modal de création/édition */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User size={20} />
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Dupont"
              required
            />
            <Input
              label="Prénom"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              placeholder="Jean"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jean.dupont@example.com"
            required
          />

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
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

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Rôle"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'charge_partenariat', label: 'Chargé de partenariat' },
                { value: 'secretaire_generale', label: 'Secrétaire générale' },
                { value: 'president', label: 'Président' }
              ]}
            />
            <Select
              label="Statut"
              value={formData.actif ? 'actif' : 'inactif'}
              onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'actif' })}
              options={[
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' }
              ]}
            />
          </div>

          <Input
            label="Téléphone (optionnel)"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="06 12 34 56 78"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
              {editingUser ? 'Mettre à jour' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key size={20} />
            Changer le mot de passe
          </h3>

          <p className="text-sm text-gray-500">
            Utilisateur : {editingUser?.prenom} {editingUser?.nom}
          </p>

          <Input
            label="Ancien mot de passe"
            type="password"
            value={passwordData.ancien_mot_de_passe}
            onChange={(e) => setPasswordData({ ...passwordData, ancien_mot_de_passe: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Input
            label="Nouveau mot de passe"
            type="password"
            value={passwordData.nouveau_mot_de_passe}
            onChange={(e) => setPasswordData({ ...passwordData, nouveau_mot_de_passe: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={passwordData.confirmation_mot_de_passe}
            onChange={(e) => setPasswordData({ ...passwordData, confirmation_mot_de_passe: e.target.value })}
            placeholder="••••••••"
            required
          />

          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle size={16} />
              Le mot de passe doit contenir au moins 8 caractères
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePassword}>
              Changer le mot de passe
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}