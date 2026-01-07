import React, { useState, useEffect } from 'react';
import userService, { User, CreateUserData, UpdateUserData, ChangePasswordData } from '../services/userService';
import provinceService, { Province } from '../services/provinceService';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');

  useEffect(() => {
    loadUsers();
    loadProvinces();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error cargando usuarios. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const provincesData = await provinceService.getAllProvinces();
      setProvinces(provincesData);
      // Set the first province as default if available
      if (provincesData.length > 0) {
        setSelectedProvince(provincesData[0]._id);
      }
    } catch (error) {
      console.error('Error cargando provincias:', error);
      setError('Error cargando provincias. Verifica tu conexión.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (userData: CreateUserData) => {
    try {
      setError('');
      const newUser = await userService.createUser(userData);
      setUsers([...users, newUser]);
      setShowAddUser(false);
    } catch (error: any) {
      setError(error.message || 'Error creando usuario');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      setError('');
      const { _id, ...updateData } = updatedUser;
      const updatedUserData = await userService.updateUser(_id, updateData);
      setUsers(users.map(user => user._id === _id ? updatedUserData : user));
      setEditingUser(null);
    } catch (error: any) {
      setError(error.message || 'Error actualizando usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        setError('');
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
      } catch (error: any) {
        setError(error.message || 'Error eliminando usuario');
      }
    }
  };

  const handleChangePassword = async (passwordData: ChangePasswordData) => {
    try {
      setError('');
      await userService.changePassword(selectedUserId, passwordData);
      setShowPasswordModal(false);
      setSelectedUserId('');
    } catch (error: any) {
      setError(error.message || 'Error cambiando contraseña');
    }
  };

  const openPasswordModal = (userId: string) => {
    setSelectedUserId(userId);
    setShowPasswordModal(true);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'role-badge admin';
      case 'worker': return 'role-badge worker';
      case 'client': return 'role-badge client';
      default: return 'role-badge';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="user-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>Gestión de Usuarios</h2>
        <button 
          className="add-user-btn"
          onClick={() => setShowAddUser(true)}
        >
          <span className="btn-icon">+</span>
          Agregar Usuario
        </button>
      </div>

      <div className="user-management-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="worker">Trabajadores</option>
            {/* <option value="client">Clientes</option> */}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td className="user-info">
                  <div className="user-avatar">
                    {user.name.charAt(0)}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-date">Creado: {formatDate(user.createdAt)}</span>
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td>
                  <span className={getRoleBadgeClass(user.role)}>
                    {user.role}
                  </span>
                </td>
                <td className="created-date">
                  {formatDate(user.createdAt)}
                </td>
                <td className="actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditUser(user)}
                    title="Editar usuario"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn password"
                    onClick={() => openPasswordModal(user._id)}
                    title="Cambiar contraseña"
                  >
                    🔑
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(user._id)}
                    title="Eliminar usuario"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-users">
          <p>No se encontraron usuarios que coincidan con los filtros.</p>
        </div>
      )}

      {/* Modal para agregar/editar usuario */}
      {(showAddUser || editingUser) && (
        <UserModal
          user={editingUser}
          onSave={editingUser ? handleUpdateUser : handleAddUser}
          onCancel={() => {
            setShowAddUser(false);
            setEditingUser(null);
          }}
          provinces={provinces}
          selectedProvince={selectedProvince}
          onProvinceChange={(provinceId) => setSelectedProvince(provinceId)}
        />
      )}

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <PasswordModal
          onSave={handleChangePassword}
          onCancel={() => {
            setShowPasswordModal(false);
            setSelectedUserId('');
          }}
        />
      )}
    </div>
  );
};

// Componente modal para agregar/editar usuarios
interface UserModalProps {
  user?: User | null;
  onSave: (userData: any) => void;
  onCancel: () => void;
  provinces: Province[];
  selectedProvince: string;
  onProvinceChange: (provinceId: string) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onSave, onCancel, provinces, selectedProvince, onProvinceChange }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'client',
    province: user?.province || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (user) {
      // Para edición, no enviar password si está vacío
      if (!submitData.password) {
        const { password, ...dataWithoutPassword } = submitData;
        onSave(dataWithoutPassword);
        return;
      }
    }
    onSave(submitData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{user ? 'Editar Usuario' : 'Agregar Usuario'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          {!user && (
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
              />
            </div>
          )}
          {user && (
            <div className="form-group">
              <label htmlFor="password">Nueva Contraseña (opcional)</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                minLength={6}
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="role">Rol *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as any})}
            >
              {/* <option value="client">Cliente</option> */}
              <option value="worker">Trabajador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {formData.role === 'worker' && (
            <div className="form-group">
              <label htmlFor="province">Provincia *</label>
              <select
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                required
              >
                <option value="">Seleccionar provincia</option>
                {provinces.map(province => (
                  <option key={province._id} value={province._id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {user ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente modal para cambiar contraseña
interface PasswordModalProps {
  onSave: (passwordData: ChangePasswordData) => void;
  onCancel: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSave, onCancel }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    onSave({ password });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Cambiar Contraseña</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña *</label>
            <input
              type="password"
              id="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Cambiar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement; 