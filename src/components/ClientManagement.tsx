import React, { useState, useEffect } from 'react';
import clientService, { Client, CreateClientData, UpdateClientData, Recipient, CreateRecipientData } from '../services/clientService';
import './ClientManagement.css';

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError('');
      const clientsData = await clientService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setError('Error cargando clientes. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || client.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddClient = async (clientData: CreateClientData) => {
    try {
      setError('');
      const newClient = await clientService.createClient(clientData);
      setClients([...clients, newClient]);
      setShowAddClient(false);
    } catch (error: any) {
      setError(error.message || 'Error creando cliente');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleUpdateClient = async (updatedClient: any) => {
    try {
      setError('');
      const { _id, ...updateData } = updatedClient;
      if (!_id) {
        setError('ID de cliente no encontrado');
        return;
      }
      const updatedClientData = await clientService.updateClient(_id, updateData);
      setClients(clients.map(client => client._id === _id ? updatedClientData : client));
      setEditingClient(null);
    } catch (error: any) {
      setError(error.message || 'Error actualizando cliente');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        setError('');
        await clientService.deleteClient(clientId);
        setClients(clients.filter(client => client._id !== clientId));
      } catch (error: any) {
        setError(error.message || 'Error eliminando cliente');
      }
    }
  };

  const openRecipientsModal = async (client: Client) => {
    try {
      setSelectedClient(client);
      setShowRecipientsModal(true);
    } catch (error: any) {
      setError(error.message || 'Error cargando destinatarios');
    }
  };

  const handleAddRecipient = async (recipientData: CreateRecipientData) => {
    if (!selectedClient) return;
    
    try {
      setError('');
      const updatedClient = await clientService.addRecipient(selectedClient._id, recipientData);
      setClients(clients.map(c => c._id === selectedClient._id ? updatedClient : c));
      setSelectedClient(updatedClient);
    } catch (error: any) {
      setError(error.message || 'Error agregando destinatario');
    }
  };

  const handleRemoveRecipient = async (recipientId: string) => {
    if (!selectedClient) return;
    
    try {
      setError('');
      const updatedClient = await clientService.removeRecipient(selectedClient._id, recipientId);
      setClients(clients.map(c => c._id === selectedClient._id ? updatedClient : c));
      setSelectedClient(updatedClient);
    } catch (error: any) {
      setError(error.message || 'Error removiendo destinatario');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueDepartments = () => {
    const departments = clients.map(client => client.department);
    return Array.from(new Set(departments)).sort();
  };

  if (isLoading) {
    return (
      <div className="client-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-management-container">
      <div className="client-management-header">
        <h2>Gestión de Clientes</h2>
        <button 
          className="add-client-btn"
          onClick={() => setShowAddClient(true)}
        >
          <span className="btn-icon">+</span>
          Agregar Cliente
        </button>
      </div>

      <div className="client-management-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los departamentos</option>
            {getUniqueDepartments().map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Departamento</th>
              <th>Destinatarios</th>
              <th>Fecha de Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client._id}>
                <td className="client-info">
                  <div className="client-avatar">
                    {client.name.charAt(0)}
                  </div>
                  <div className="client-details">
                    <span className="client-name">{client.name}</span>
                    <span className="client-email">{client.email}</span>
                  </div>
                </td>
                <td className="client-email">{client.email}</td>
                <td className="client-phone">{client.phone}</td>
                <td className="client-department">{client.department}</td>
                <td className="recipients-count">
                  {client.recipients.length} destinatario{client.recipients.length !== 1 ? 's' : ''}
                </td>
                <td className="created-date">
                  {formatDate(client.createdAt)}
                </td>
                <td className="actions">
                  <button
                    className="action-btn recipients"
                    onClick={() => openRecipientsModal(client)}
                    title="Gestionar destinatarios"
                  >
                    👥
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditClient(client)}
                    title="Editar cliente"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteClient(client._id)}
                    title="Eliminar cliente"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClients.length === 0 && (
        <div className="no-clients">
          <p>No se encontraron clientes que coincidan con los filtros.</p>
        </div>
      )}

      {/* Modal para agregar/editar cliente */}
      {(showAddClient || editingClient) && (
        <ClientModal
          client={editingClient}
          onSave={editingClient ? handleUpdateClient : handleAddClient}
          onCancel={() => {
            setShowAddClient(false);
            setEditingClient(null);
          }}
        />
      )}

      {/* Modal para gestionar destinatarios */}
      {showRecipientsModal && selectedClient && (
        <RecipientsModal
          client={selectedClient}
          onAdd={handleAddRecipient}
          onRemove={handleRemoveRecipient}
          onCancel={() => {
            setShowRecipientsModal(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
};

// Componente modal para agregar/editar clientes
interface ClientModalProps {
  client?: Client | null;
  onSave: (clientData: any) => void;
  onCancel: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    _id: client?._id || '',
    name: client?.name || '',
    address: client?.address || '',
    department: client?.department || '',
    phone: client?.phone || '',
    email: client?.email || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      // Editing existing client - include _id
      onSave(formData);
    } else {
      // Creating new client - exclude _id
      const { _id, ...createData } = formData;
      onSave(createData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{client ? 'Editar Cliente' : 'Agregar Cliente'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="client-form">
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
          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="department">Departamento *</label>
            <input
              type="text"
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Dirección *</label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {client ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente modal para gestionar destinatarios
interface RecipientsModalProps {
  client: Client;
  onAdd: (recipientData: CreateRecipientData) => void;
  onRemove: (recipientId: string) => void;
  onCancel: () => void;
}

const RecipientsModal: React.FC<RecipientsModalProps> = ({ client, onAdd, onRemove, onCancel }) => {
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    phone: '',
    address: '',
    bankCardNumber: ''
  });

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(recipientForm);
    setRecipientForm({ name: '', phone: '', address: '', bankCardNumber: '' });
    setShowAddRecipient(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Destinatarios de {client.name}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="recipients-modal-content">
          <div className="recipients-header">
            <h4>Destinatarios ({client.recipients.length})</h4>
            <button
              className="btn-primary small"
              onClick={() => setShowAddRecipient(true)}
            >
              + Agregar Destinatario
            </button>
          </div>
          
          <div className="recipients-list">
            {client.recipients.map(recipient => (
              <div key={recipient._id} className="recipient-item">
                <div className="recipient-info">
                  <span className="recipient-name">{recipient.name}</span>
                  <span className="recipient-phone">{recipient.phone}</span>
                  <span className="recipient-address">{recipient.address}</span>
                  {recipient.bankCardNumber && (
                    <span className="recipient-card">Tarjeta: {recipient.bankCardNumber}</span>
                  )}
                </div>
                <button
                  className="btn-danger small"
                  onClick={() => onRemove(recipient._id!)}
                  title="Eliminar destinatario"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {client.recipients.length === 0 && (
              <p className="no-recipients">No hay destinatarios registrados</p>
            )}
          </div>

          {showAddRecipient && (
            <div className="add-recipient-form">
              <h5>Agregar Destinatario</h5>
              <form onSubmit={handleAddRecipient}>
                <div className="form-group">
                  <label htmlFor="recipientName">Nombre *</label>
                  <input
                    type="text"
                    id="recipientName"
                    value={recipientForm.name}
                    onChange={(e) => setRecipientForm({...recipientForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recipientPhone">Teléfono *</label>
                  <input
                    type="tel"
                    id="recipientPhone"
                    value={recipientForm.phone}
                    onChange={(e) => setRecipientForm({...recipientForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recipientAddress">Dirección *</label>
                  <textarea
                    id="recipientAddress"
                    value={recipientForm.address}
                    onChange={(e) => setRecipientForm({...recipientForm, address: e.target.value})}
                    required
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recipientCard">Número de Tarjeta (opcional)</label>
                  <input
                    type="text"
                    id="recipientCard"
                    value={recipientForm.bankCardNumber}
                    onChange={(e) => setRecipientForm({...recipientForm, bankCardNumber: e.target.value})}
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddRecipient(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement; 