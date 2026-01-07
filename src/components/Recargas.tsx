import React, { useState, useEffect } from 'react';
import recargaService, { Recarga, CreateRecargaData, OfertaRecarga } from '../services/recargaService';
import clientService from '../services/clientService';
import provinceService from '../services/provinceService';
import './RemesaManagement.css';

const RecargasManagement: React.FC = () => {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<OfertaRecarga[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedOferta, setSelectedOferta] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecarga, setSelectedRecarga] = useState<Recarga | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateRecargaData>({
    oferta: '',
    client: '',
    phone: '',
    confirmation: '',
    destinationProvince: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [recargasData, clientsData, provincesData, ofertasData] = await Promise.all([
        recargaService.getAllRecargas(),
        clientService.getAllClients(),
        provinceService.getAllProvinces(),
        recargaService.getOfertasActivas()
      ]);
      setRecargas(recargasData);
      setClients(clientsData);
      setProvinces(provincesData);
      setOfertas(ofertasData);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfertaChange = (ofertaId: string) => {
    setSelectedOferta(ofertaId);
    const selectedOfertaData = ofertas.find(o => o._id === ofertaId);
    setFormData({
      ...formData,
      oferta: ofertaId
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      // Set a default confirmation for creation
      const recargaData = {
        ...formData,
        confirmation: 'Pendiente de confirmación'
      };
      
      const newRecarga = await recargaService.createRecarga(recargaData);
      
      // Refresh the recargas list to get updated data with populated fields
      try {
        const updatedRecargas = await recargaService.getAllRecargas();
        setRecargas(updatedRecargas);
      } catch (refreshError) {
        console.error('Error refreshing recargas list:', refreshError);
        // Fallback: add the new recarga to the existing list
        setRecargas([newRecarga, ...recargas]);
      }
      
      // Reset form
      setFormData({
        oferta: '',
        client: '',
        phone: '',
        confirmation: '',
        destinationProvince: ''
      });
      setSelectedClient('');
      setSelectedOferta('');
      setSelectedProvince('');
      setShowCreateForm(false);
      
      // Show confirmation modal
      // setSelectedRecarga(newRecarga);
      // setShowConfirmModal(true);
      setConfirmationText('');
    } catch (error: any) {
      console.error('Error creating recarga:', error);
      setError(error.message || 'Error al crear la recarga');
    }
  };

  const handleOpenConfirmModal = (recarga: Recarga) => {
    setSelectedRecarga(recarga);
    setConfirmationText('');
    setShowConfirmModal(true);
  };

  const handleConfirmRecarga = async () => {
    if (!selectedRecarga || !confirmationText.trim()) {
      setError('Por favor ingrese el texto de confirmación');
      return;
    }

    try {
      setError('');
      await recargaService.confirmarRecarga(selectedRecarga._id, confirmationText);
      
      // Update the recarga in the list
      const updatedRecargas = recargas.map(r => 
        r._id === selectedRecarga._id 
          ? { ...r, status: 'Realizado' as const, confirmation: confirmationText }
          : r
      );
      setRecargas(updatedRecargas);
      
      setShowConfirmModal(false);
      setSelectedRecarga(null);
      setConfirmationText('');
    } catch (error: any) {
      console.error('Error confirming recarga:', error);
      setError(error.message || 'Error al confirmar la recarga');
    }
  };

  const handleCreateClient = async (clientData: any) => {
    try {
      const newClient = await clientService.createClient(clientData);
      setClients([...clients, newClient]);
      setSelectedClient(newClient._id);
      setFormData({ ...formData, client: newClient._id });
      setShowCreateClient(false);
    } catch (error: any) {
      console.error('Error creating client:', error);
      setError(error.message || 'Error al crear el cliente');
    }
  };

  const getStatusClass = (status: string) => {
    return status === 'Realizado' ? 'completed' : 'pending';
  };

  if (loading) {
    return (
      <div className="remesa-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="remesa-management-container">
      <div className="remesa-management-header">
        <h2>Gestión de Recargas</h2>
        <button className="add-remesa-btn" onClick={() => setShowCreateForm(true)}>
          <span className="btn-icon">+</span> Nueva Recarga
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
              <th>Oferta</th>
              <th>Teléfono</th>
              <th>Monto</th>
              <th>Provincia</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recargas.map((recarga) => (
              <tr key={recarga._id}>
                <td>{recarga.client?.name || 'N/A'}</td>
                <td>
                  <div>
                    <strong>{recarga.oferta?.titulo || 'N/A'}</strong>
                    {recarga.oferta?.bonos && recarga.oferta.bonos.length > 0 && (
                      <div className="bonos-list">
                        {recarga.oferta.bonos.map((bono: any, index: number) => (
                          <span key={index} className="bono-tag">
                            {bono.titulo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>{recarga.phone}</td>
                <td className="amount">${recarga.amount.toFixed(2)}</td>
                <td>{recarga.destinationProvince?.name || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(recarga.status)}`}>
                    {recarga.status}
                  </span>
                </td>
                <td>{new Date(recarga.date).toLocaleDateString('es-CU')}</td>
                <td>
                  <div className="actions">
                    {recarga.status === 'Pendiente' && (
                      <button 
                        className="action-btn confirm-btn"
                        onClick={() => handleOpenConfirmModal(recarga)}
                        title="Confirmar recarga"
                      >
                        ✅ Confirmar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear nueva recarga */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nueva Recarga</h3>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="remesa-form">
              <div className="form-group">
                <label htmlFor="oferta">Oferta *</label>
                <select
                  id="oferta"
                  value={selectedOferta}
                  onChange={(e) => handleOfertaChange(e.target.value)}
                  required
                >
                  <option value="">Seleccionar oferta</option>
                  {ofertas.map((oferta) => (
                    <option key={oferta._id} value={oferta._id}>
                      {oferta.titulo} - ${oferta.precio.toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedOferta && (
                  <div className="oferta-details">
                    <p><strong>Descripción:</strong> {ofertas.find(o => o._id === selectedOferta)?.descripcion}</p>
                    <p><strong>Precio:</strong> ${ofertas.find(o => o._id === selectedOferta)?.precio.toFixed(2)}</p>
                    {ofertas.find(o => o._id === selectedOferta)?.bonos && (
                      <div>
                        <strong>Bonos incluidos:</strong>
                        <div className="bonos-list">
                          {ofertas.find(o => o._id === selectedOferta)?.bonos.map((bono: any, index: number) => (
                            <span key={index} className="bono-tag">
                              {bono.titulo} ({bono.tipo})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="client">Cliente *</label>
                <select
                  id="client"
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setFormData({ ...formData, client: e.target.value });
                  }}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {/* <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateClient(true)}
                >
                  + Crear Nuevo Cliente
                </button> */}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Teléfono *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Teléfono del cliente"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="destinationProvince">Provincia Destino *</label>
                <select
                  id="destinationProvince"
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setFormData({ ...formData, destinationProvince: e.target.value });
                  }}
                  required
                >
                  <option value="">Seleccionar provincia</option>
                  {provinces.map((province) => (
                    <option key={province._id} value={province._id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Recarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear cliente */}
      {showCreateClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear Nuevo Cliente</h3>
              <button className="modal-close" onClick={() => setShowCreateClient(false)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateClient({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                address: formData.get('address') as string
              });
            }} className="client-form">
              <div className="form-group">
                <label htmlFor="clientName">Nombre *</label>
                <input
                  type="text"
                  id="clientName"
                  name="name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="clientEmail">Email *</label>
                <input
                  type="email"
                  id="clientEmail"
                  name="email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="clientPhone">Teléfono *</label>
                <input
                  type="tel"
                  id="clientPhone"
                  name="phone"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="clientAddress">Dirección</label>
                <input
                  type="text"
                  id="clientAddress"
                  name="address"
                />
              </div>
              <div className="form-actions">
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

      {/* Modal de confirmación */}
      {showConfirmModal && selectedRecarga && (
        <div className="modal-overlay">
          <div className="modal-content" style={{padding:'10px'}}>
            <div className="modal-header">
              <h3>Confirmar Recarga</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="remesa-details">
              <p><strong>Cliente:</strong> {selectedRecarga.client?.name || 'N/A'}</p>
              <p><strong>Oferta:</strong> {selectedRecarga.oferta?.titulo || 'N/A'}</p>
              {selectedRecarga.oferta?.bonos && selectedRecarga.oferta.bonos.length > 0 && (
                <div>
                  <strong>Bonos incluidos:</strong>
                  <div className="bonos-list">
                    {selectedRecarga.oferta.bonos.map((bono: any, index: number) => (
                      <span key={index} className="bono-tag">
                        {bono.titulo} ({bono.tipo})
                      </span>
                    ))}
                  </div>
                  <ul className="bonos-list-detail">
                    {selectedRecarga.oferta.bonos.map((bono: any, index: number) => (
                      <li key={index}>
                        <strong>{bono.titulo}</strong> - Tipo: {bono.tipo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p><strong>Teléfono:</strong> {selectedRecarga.phone}</p>
              <p><strong>Monto:</strong> ${selectedRecarga.amount.toFixed(2)}</p>
              <p><strong>Provincia Destino:</strong> {selectedRecarga.destinationProvince?.name || 'N/A'}</p>
              <div className="form-group">
                <label htmlFor="confirmationText">Confirmación *</label>
                <textarea
                  id="confirmationText"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Ingrese el texto de confirmación"
                  required
                  rows={6}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleConfirmRecarga}
                disabled={!confirmationText.trim()}
              >
                Confirmar Recarga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecargasManagement;
