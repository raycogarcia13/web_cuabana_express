import React, { useState, useEffect } from 'react';
import remesaService, { Remesa, CreateRemesaData } from '../services/remesaService';
import clientService from '../services/clientService';
import provinceService from '../services/provinceService';
// Fix for IDE caching - trigger refresh
import './RemesaManagement.css';

const RemesaManagement: React.FC = () => {
  const [remesas, setRemesas] = useState<Remesa[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRemesa, setSelectedRemesa] = useState<Remesa | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [manualBeneficiary, setManualBeneficiary] = useState(false);
  const [editableBeneficiary, setEditableBeneficiary] = useState({
    name: '',
    phone: '',
    address: '',
    cardNumber: ''
  } as {
    name: string;
    phone: string;
    address: string;
    cardNumber: string;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateRemesaData>({
    amount: 20,
    cost: 20,
    client: '',
    beneficiary: '',
    destinationProvince: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [remesasData, clientsData, provincesData] = await Promise.all([
        remesaService.getAllRemesas(),
        clientService.getAllClients(),
        provinceService.getAllProvinces()
      ]);
      setRemesas(remesasData);
      setClients(clientsData);
      setProvinces(provincesData);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (amount: number) => {
    const calculatedCost = amount<=100 ? 20 : Math.ceil(amount / 100) * 20;
    setFormData({ 
      ...formData, 
      amount, 
      cost: calculatedCost 
    });
  };

  const handleBeneficiaryChange = (value: string) => {
    if (value === 'manual') {
      setManualBeneficiary(true);
      setSelectedBeneficiary('manual');
      setFormData({ 
        ...formData, 
        beneficiary: 'manual' 
      });
    } else {
      setManualBeneficiary(false);
      setSelectedBeneficiary(value);
      setFormData({ 
        ...formData, 
        beneficiary: value 
      });
      
      // Si se selecciona un beneficiario existente, limpiar datos manuales
      // Nota: Los datos manuales se limpian automáticamente al cambiar selección
    }
  };

  const handleEditableBeneficiaryChange = (field: string, value: string) => {
    setEditableBeneficiary((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const selectedClientData = clients.find(c => c._id === clientId);
    if (selectedClientData && selectedClientData.recipients && selectedClientData.recipients.length > 0) {
      // Por defecto, seleccionar modo manual
      setManualBeneficiary(true);
      setSelectedBeneficiary('manual');
      setFormData({ 
        ...formData, 
        client: clientId, 
        beneficiary: 'manual' 
      });
    } else {
      // Si no tiene beneficiarios, mantener modo manual
      setManualBeneficiary(true);
      setSelectedBeneficiary('manual');
      setFormData({ 
        ...formData, 
        client: clientId, 
        beneficiary: 'manual' 
      });
    }
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      setError('');
      console.log('Creating new client from RemesaManagement:', clientData);
      const newClient = await clientService.createClient(clientData);
      setClients([...clients, newClient]);
      setShowCreateClient(false);
    } catch (error: any) {
      setError(error.message || 'Error creando cliente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      // Preparar datos para enviar
      let formDataToSend = { ...formData };
      
      // Si el beneficiario es manual, enviar los datos completos
      if (formData.beneficiary === 'manual' && manualBeneficiary) {
        formDataToSend.beneficiary = {
          name: editableBeneficiary.name,
          phone: editableBeneficiary.phone,
          address: editableBeneficiary.address,
          cardNumber: editableBeneficiary.cardNumber
        } as {
          name: string;
          phone: string;
          address: string;
          cardNumber: string;
        };
      }
      
      const newRemesa = await remesaService.createRemesa(formDataToSend);
      
      // Refresh the remesas list to get updated data with populated fields
      try {
        const updatedRemesas = await remesaService.getAllRemesas();
        setRemesas(updatedRemesas);
      } catch (refreshError) {
        console.error('Error refreshing remesas list:', refreshError);
        // Fallback: add the new remesa to the existing list
        setRemesas([newRemesa, ...remesas]);
      }
      
      setShowCreateForm(false);
      setFormData({
        amount: 20,
        cost: 20,
        client: '',
        beneficiary: '',
        destinationProvince: '',
        description: ''
      });
      setSelectedClient('');
      setSelectedBeneficiary('');
      setManualBeneficiary(false);
      setEditableBeneficiary({
        name: '',
        phone: '',
        address: '',
        cardNumber: ''
      });
    } catch (error: any) {
      setError(error.message || 'Error creando remesa');
    }
  };

  const handleConfirmar = async (remesaId: string, confirmation: string) => {
    try {
      setError('');
      
      // Determinar si se deben enviar los datos del beneficiario
      let beneficiaryDataToSend;
      if (selectedRemesa?.beneficiary && typeof selectedRemesa.beneficiary === 'object') {
        // Si el beneficiario actual tiene datos editables, enviar los datos actualizados
        beneficiaryDataToSend = editableBeneficiary;
      }
      
      const updatedRemesa = await remesaService.confirmarRemesa(remesaId, confirmation, beneficiaryDataToSend);
      setRemesas(remesas.map(r => r._id === remesaId ? updatedRemesa : r));
    } catch (error: any) {
      setError(error.message || 'Error confirmando remesa');
    }
  };

  const handleOpenConfirmModal = (remesa: Remesa) => {
    setSelectedRemesa(remesa);
    setConfirmationText('');
    // Inicializar datos editables del beneficiario
    if (remesa.beneficiary && typeof remesa.beneficiary === 'object') {
      setEditableBeneficiary({
        name: remesa.beneficiary.name || '',
        phone: remesa.beneficiary.phone || '',
        address: remesa.beneficiary.address || '',
        cardNumber: remesa.beneficiary?.cardNumber || ''
      });
    } else {
      setEditableBeneficiary({
        name: '',
        phone: '',
        address: '',
        cardNumber: ''
      });
    }
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedRemesa(null);
    setConfirmationText('');
  };

  const handleConfirmSubmit = async () => {
    if (!selectedRemesa || !confirmationText.trim()) {
      setError('La confirmación es obligatoria');
      return;
    }

    try {
      await handleConfirmar(selectedRemesa._id, confirmationText);
      handleCloseConfirmModal();
    } catch (error: any) {
      setError(error.message || 'Error confirmando remesa');
    }
  };

  const getBeneficiariosForClient = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    return client?.recipients || [];
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'Realizado' ? 'status-badge completed' : 'status-badge pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="remesa-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando remesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="remesa-management-container">
      <div className="remesa-management-header">
        <h2>Gestión de Remesas</h2>
        <button 
          className="add-remesa-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="btn-icon">+</span>
          Nueva Remesa
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="remesas-table-container">
        <table className="remesas-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Beneficiario</th>
              <th>Monto</th>
              <th>Costo</th>
              <th>Provincia Destino</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {remesas.map(remesa => (
              <tr key={remesa._id}>
                <td>{remesa.client?.name || 'N/A'}</td>
                <td>{remesa.beneficiary?.name || 'N/A'}</td>
                <td className="amount">
                  ${remesa.amount.toFixed(2)}
                </td>
                <td className="cost">
                  ${remesa.cost.toFixed(2)}
                </td>
                <td>{remesa.destinationProvince?.name || 'N/A'}</td>
                <td>{formatDate(remesa.date)}</td>
                <td>
                  <span className={getStatusBadgeClass(remesa.status)}>
                    {remesa.status}
                  </span>
                </td>
                <td className="actions">
                  {remesa.status === 'Pendiente' && (
                    <button
                      className="action-btn confirm"
                      onClick={() => handleOpenConfirmModal(remesa)}
                      title="Confirmar remesa"
                    >
                      ✅
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear nueva remesa */}
      {showCreateForm && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nueva Remesa</h3>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="remesa-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client">Cliente *</label>
                  <select 
                    id="client"
                    value={selectedClient}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un cliente</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {/* <button 
                    type="button" 
                    className="btn-small"
                    onClick={() => {
                      window.location.href = '/clientes';
                      setTimeout(() => setShowCreateClient(true), 100);
                    }}
                  >
                    + Nuevo Cliente
                  </button> */}
                </div>
              </div>

              {selectedClient && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="beneficiary">Beneficiario *</label>
                    <select 
                      id="beneficiary"
                      value={selectedBeneficiary}
                      onChange={(e) => handleBeneficiaryChange(e.target.value)}
                      required
                    >
                      <option value="manual">+ Ingresar datos manualmente</option>
                      <option value="">Seleccione un beneficiario existente</option>
                      {getBeneficiariosForClient(selectedClient).map((recipient: any) => (
                        <option key={recipient._id} value={recipient._id}>
                          {recipient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Campos manuales de beneficiario */}
              {manualBeneficiary && (
                <div className="beneficiary-editable" style={{marginLeft: '10px', marginTop: '5px', padding: '5px'}}>
                  <div className="form-row" style={{marginBottom: '5px'}}>
                    <div className="form-group" style={{marginBottom: '3px'}}>
                      <label style={{marginBottom: '2px'}}>Nombre del Beneficiario:</label>
                      <input
                        type="text"
                        value={editableBeneficiary.name}
                        onChange={(e) => handleEditableBeneficiaryChange('name', e.target.value)}
                        placeholder="Nombre del beneficiario"
                        style={{padding: '6px'}}
                      />
                    </div>
                    <div className="form-group" style={{marginBottom: '3px'}}>
                      <label style={{marginBottom: '2px'}}>Teléfono del Beneficiario:</label>
                      <input
                        type="tel"
                        value={editableBeneficiary.phone}
                        onChange={(e) => handleEditableBeneficiaryChange('phone', e.target.value)}
                        placeholder="Teléfono del beneficiario"
                        style={{padding: '6px'}}
                      />
                    </div>
                  </div>
                  <div className="form-row" style={{marginBottom: '5px'}}>
                    <div className="form-group" style={{marginBottom: '3px'}}>
                      <label style={{marginBottom: '2px'}}>Dirección del Beneficiario:</label>
                      <input
                        type="text"
                        value={editableBeneficiary.address}
                        onChange={(e) => handleEditableBeneficiaryChange('address', e.target.value)}
                        placeholder="Dirección del beneficiario"
                        style={{padding: '6px'}}
                      />
                    </div>
                    <div className="form-group" style={{marginBottom: '3px'}}>
                      <label style={{marginBottom: '2px'}}>Tarjeta de Crédito:</label>
                      <input
                        type="text"
                        value={editableBeneficiary.cardNumber}
                        onChange={(e) => handleEditableBeneficiaryChange('cardNumber', e.target.value)}
                        placeholder="Número de tarjeta de crédito"
                        style={{padding: '6px'}}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">Monto *</label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    required
                    min="20"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cost">Costo (20% del monto)</label>
                  <input
                    type="number"
                    id="cost"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="destinationProvince">Provincia Destino *</label>
                  <select 
                    id="destinationProvince"
                    value={formData.destinationProvince}
                    onChange={(e) => setFormData({ ...formData, destinationProvince: e.target.value })}
                    required
                  >
                    <option value="">Seleccione una provincia</option>
                    {provinces.map(province => (
                      <option key={province._id} value={province._id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Ingrese una descripción (opcional)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Remesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear cliente */}
      {showCreateClient && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nuevo Cliente</h3>
              <button className="modal-close" onClick={() => setShowCreateClient(false)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clientData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                cardNumber: formData.get('cardNumber'),
                identityCard: formData.get('identityCard')
              };
              handleCreateClient(clientData);
            }} className="client-form">
              <div className="form-group">
                <label htmlFor="name">Nombre *</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Teléfono *</label>
                <input type="tel" id="phone" name="phone" required />
              </div>
              <div className="form-group">
                <label htmlFor="address">Dirección</label>
                <input type="text" id="address" name="address" />
              </div>
              <div className="form-group">
                <label htmlFor="cardNumber">Número de Tarjeta</label>
                <input type="text" id="cardNumber" name="cardNumber" placeholder="Opcional" />
              </div>
              <div className="form-group">
                <label htmlFor="identityCard">Carnet de Identidad *</label>
                <input type="text" id="identityCard" name="identityCard" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateClient(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para confirmar remesa */}
      {showConfirmModal && selectedRemesa && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal-content" style={{padding:10}}>
            <div className="modal-header">
              <h3>Confirmar Remesa</h3>
              <button className="modal-close" onClick={handleCloseConfirmModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="remesa-details">
                <p><strong>Cliente:</strong> {selectedRemesa.client?.name || 'N/A'}</p>
                <p><strong>Beneficiario:</strong> {selectedRemesa.beneficiary?.name || 'N/A'}</p>
                {selectedRemesa.beneficiary?.phone && (
                  <p><strong>Teléfono:</strong> {selectedRemesa.beneficiary.phone}</p>
                )}
                {selectedRemesa.beneficiary?.cardNumber && (
                  <p><strong>Número de Tarjeta:</strong> {selectedRemesa.beneficiary.cardNumber}</p>
                )}
                <p><strong>Monto:</strong> ${selectedRemesa.amount.toFixed(2)}</p>
                <p><strong>Costo:</strong> ${selectedRemesa.cost.toFixed(2)}</p>
                <p><strong>Provincia Destino:</strong> {selectedRemesa.destinationProvince?.name || 'N/A'}</p>
              </div>
              <div className="form-group">
                <label htmlFor="confirmation">Confirmación *</label>
                <textarea
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  required
                  rows={4}
                  placeholder="Ingrese los detalles de confirmación de la remesa..."
                />
              </div>
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                style={{background:'#ba3539'}}
                className="btn-secondary" 
                onClick={handleCloseConfirmModal}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleConfirmSubmit}
                disabled={!confirmationText.trim()}
              >
                Confirmar Remesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemesaManagement;
