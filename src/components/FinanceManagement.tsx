import React, { useState, useEffect } from 'react';
import financeService from '../services/financeService';
import './FinanceManagement.css';

interface FinancialStatus {
  byProvince: Array<{
    province: {
      _id: string;
      name: string;
    };
    total: number;
    movements: Array<{
      type: string;
      amount: number;
      operationId?: string;
      _id: string;
      date: string;
    }>;
  }>;
  total: number;
}

interface Operation {
  type: 'entrada' | 'remesa' | 'recarga';
  amount: number;
  provinceId: string;
}

const FinanceManagement: React.FC = () => {
  const [financialStatus, setFinancialStatus] = useState<FinancialStatus | null>(null);
  const [operations, setOperations] = useState<any[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<{provinceId: string, operationId: string, type: string, amount: number} | null>(null);
  const [showRemesaDetail, setShowRemesaDetail] = useState(false);
  const [selectedRemesa, setSelectedRemesa] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [newOperation, setNewOperation] = useState<Operation>({
    type: 'entrada',
    amount: 0,
    provinceId: ''
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  useEffect(() => {
    // Apply filtering when operations or filter type changes
    let filtered = [...operations];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(op => op.type === filterType);
    }
    
    // Filter by province
    if (filterProvince !== 'all') {
      filtered = filtered.filter(op => op.province?._id === filterProvince);
    }
    
    // Sort by date (newest first) and take last 10
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredOperations(filtered.slice(0, 10));
  }, [operations, filterType, filterProvince]);

  const loadFinancialData = async () => {
    try {
      const [status, ops, provincesData] = await Promise.all([
        financeService.getFinancialStatus(),
        financeService.getOperations(),
        financeService.getAllProvinces()
      ]);
      setFinancialStatus(status);
      setOperations(ops);
      setProvinces(provincesData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.addOperation(newOperation);
      await loadFinancialData();
      setShowAddOperation(false);
      setNewOperation({
        type: 'entrada',
        amount: 0,
        provinceId: ''
      });
    } catch (error) {
      console.error('Error adding operation:', error);
    }
  };

  const handleDeleteOperation = (operation: any) => {
    console.log('Operation data:', operation);
    console.log('Operation _id:', operation._id);
    console.log('Operation operationId:', operation.operationId);
    
    setOperationToDelete({
      provinceId: operation.province._id,
      operationId: operation._id,
      type: operation.type,
      amount: Math.abs(operation.amount)
    });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteOperation = async () => {
    if (!operationToDelete) return;
    
    try {
      await financeService.deleteOperation(operationToDelete.provinceId, operationToDelete.operationId);
      await loadFinancialData();
      setShowDeleteConfirm(false);
      setOperationToDelete(null);
    } catch (error) {
      console.error('Error deleting operation:', error);
    }
  };

  const cancelDeleteOperation = () => {
    setShowDeleteConfirm(false);
    setOperationToDelete(null);
  };

  const handleShowRemesaDetail = async (operationId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/remesas/${operationId}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`,
          'Content-Type': 'application/json'
        }
      });
      const remesaData = await response.json();
      setSelectedRemesa(remesaData);
      setShowRemesaDetail(true);
    } catch (error) {
      console.error('Error fetching remesa details:', error);
    }
  };

  const handleShowRecargaDetail = async (operationId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/recargas/${operationId}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`,
          'Content-Type': 'application/json'
        }
      });
      const recargaData = await response.json();
      const data_orginzed = {
        ...recargaData,
        beneficiary:{
          phone: recargaData.phone,
        },
        cost: recargaData.oferta.costo,
        description: recargaData.oferta.descripcion
      }
      setSelectedRemesa(data_orginzed);
      setShowRemesaDetail(true);
    } catch (error) {
      console.error('Error fetching recarga details:', error);
    }
  };

  const handleCloseRemesaDetail = () => {
    setShowRemesaDetail(false);
    setSelectedRemesa(null);
  };

  const isOperationToday = (operationDate: string) => {
    const today = new Date();
    const opDate = new Date(operationDate);
    return today.toDateString() === opDate.toDateString();
  };

  if (loading) {
    return <div className="finance-loading">Cargando datos financieros...</div>;
  }

  return (
    <div className="finance-management">
      <div className="finance-header">
        <h2>Administración de Finanzas</h2>
        <button 
          className="add-operation-btn"
          onClick={() => setShowAddOperation(true)}
        >
          + Agregar Operación
        </button>
      </div>

      {/* Resumen General */}
      <div className="finance-summary">
        <div className="summary-card total">
          <h3>Total General</h3>
          <p className="amount">
            {new Intl.NumberFormat('es-CU', {
              style: 'currency',
              currency: 'CUP'
            }).format(financialStatus?.total || 0)}
          </p>
        </div>
        
        <div className="summary-card operations">
          <h3>Total de Operaciones</h3>
          <p className="count">
            {financialStatus?.byProvince.reduce((sum, item) => sum + (item.movements?.length || 0), 0) || 0}
          </p>
        </div>
      </div>

      {/* Resumen por Provincia */}
      <div className="province-summary">
        <h3>Resumen por Provincia</h3>
        <div className="province-grid">
          {financialStatus?.byProvince.map((item, index) => (
            <div key={index} className="province-card">
              <h4>{item.province?.name || 'Sin provincia'}</h4>
              <p className="amount">
                {new Intl.NumberFormat('es-CU', {
                  style: 'currency',
                  currency: 'CUP'
                }).format(item.total)}
              </p>
              <p className="operations">{item.movements?.length || 0} operaciones</p>
            </div>
          ))}
        </div>
      </div>

      {/* Operaciones Recientes */}
      <div className="recent-operations">
        <div className="operations-header">
          <h3>Últimas 10 Operaciones</h3>
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="filter-type">Tipo:</label>
              <select 
                id="filter-type"
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todas</option>
                <option value="entrada">📥 Entradas</option>
                <option value="remesa">💸 Remesas</option>
                <option value="recarga">📱 Recargas</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-province">Provincia:</label>
              <select 
                id="filter-province"
                value={filterProvince} 
                onChange={(e) => setFilterProvince(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todas</option>
                {provinces.map((province) => (
                  <option key={province._id} value={province._id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="operations-table">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Provincia</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperations.map((op, index) => (
                <tr key={index}>
                  <td className={`type-${op.type}`}>
                    {op.type === 'entrada' ? '📥 Entrada' : 
                     op.type === 'remesa' ? '💸 Remesa' : '📱 Recarga'}
                  </td>
                  <td className="amount">
                    {new Intl.NumberFormat('es-CU', {
                      style: 'currency',
                      currency: 'CUP'
                    }).format(Math.abs(op.amount))}
                  </td>
                  <td>{op.province?.name || 'N/A'}</td>
                  <td>{new Date(op.date).toLocaleDateString('es-CU')}</td>
                  <td>
                    <div className="table-actions">
                      {(op.type === 'remesa' || op.type === 'recarga') && op.operationId && (
                        <button 
                          className="detail-btn"
                          onClick={() => op.type === 'remesa' ? handleShowRemesaDetail(op.operationId) : handleShowRecargaDetail(op.operationId)}
                          title={`Ver detalles de ${op.type === 'remesa' ? 'remesa' : 'recarga'}`}
                        >
                          📋 Detalles
                        </button>
                      )}
                      {isOperationToday(op.date) && !op.operationId && (
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteOperation(op)}
                          title="Eliminar operación"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para agregar operación */}
      {showAddOperation && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal">
            <h3>Agregar Nueva Operación</h3>
            <form onSubmit={handleAddOperation}>
              <div className="form-group">
                <label>Tipo de Operación:</label>
                <select
                  value={newOperation.type}
                  onChange={(e) => setNewOperation({
                    ...newOperation,
                    type: e.target.value as 'entrada' | 'remesa' | 'recarga'
                  })}
                >
                  <option value="entrada">Entrada</option>
                  <option value="remesa">Remesa</option>
                  <option value="recarga">Recarga</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Monto:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newOperation.amount}
                  onChange={(e) => setNewOperation({
                    ...newOperation,
                    amount: parseFloat(e.target.value)
                  })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Provincia:</label>
                <select
                  value={newOperation.provinceId}
                  onChange={(e) => setNewOperation({
                    ...newOperation,
                    provinceId: e.target.value
                  })}
                  required
                >
                  <option value="">Seleccione una provincia</option>
                  {provinces.map((province) => (
                    <option key={province._id} value={province._id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddOperation(false)}>
                  Cancelar
                </button>
                <button type="submit">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && operationToDelete && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal confirmation-modal">
            <h3>Confirmar Eliminación</h3>
            <p>
              ¿Está seguro que desea eliminar esta operación?
              <br />
              <strong>
                {operationToDelete.type === 'entrada' ? '📥 Entrada' : 
                 operationToDelete.type === 'remesa' ? '💸 Remesa' : '📱 Recarga'} - 
                {new Intl.NumberFormat('es-CU', {
                  style: 'currency',
                  currency: 'CUP'
                }).format(operationToDelete.amount)}
              </strong>
            </p>
            <div className="confirmation-actions">
              <button 
                className="cancel-delete"
                onClick={cancelDeleteOperation}
              >
                Cancelar
              </button>
              <button 
                className="confirm-delete"
                onClick={confirmDeleteOperation}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de remesa */}
      {showRemesaDetail && selectedRemesa && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal remesa-detail-modal" style={{maxWidth: '800px', width: '90%'}}>
            <div className="modal-header">
              <h3>Detalles de {selectedRemesa.type === 'remesa' ? 'Remesa' : 'Recarga'}</h3>
              <button className="modal-close" onClick={handleCloseRemesaDetail}>×</button>
            </div>
            <div className="remesa-detail-content" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px'}}>
              <div className="detail-section">
                <h4 style={{marginBottom: '12px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '5px'}}>Información General</h4>
                <p style={{margin: '8px 0'}}><strong>ID:</strong> {selectedRemesa._id}</p>
                <p style={{margin: '8px 0'}}><strong>Estado:</strong> 
                  <span className={`status-badge ${selectedRemesa.status === 'Realizado' ? 'completed' : 'pending'}`} style={{marginLeft: '8px'}}>
                    {selectedRemesa.status}
                  </span>
                </p>
                <p style={{margin: '8px 0'}}><strong>Fecha:</strong> {new Date(selectedRemesa.date).toLocaleDateString('es-CU')}</p>
                <p style={{margin: '8px 0'}}><strong>Descripción:</strong> {selectedRemesa.description || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h4 style={{marginBottom: '12px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '5px'}}>Información Financiera</h4>
                <p style={{margin: '8px 0'}}><strong>Monto:</strong> 
                  <span className="amount" style={{fontWeight: 'bold', color: '#28a745', marginLeft: '8px'}}>
                    {new Intl.NumberFormat('es-CU', {
                      style: 'currency',
                      currency: 'CUP'
                    }).format(selectedRemesa.amount)}
                  </span>
                </p>
                <p style={{margin: '8px 0'}}><strong>Costo:</strong> 
                  <span className="cost" style={{fontWeight: 'bold', color: '#dc3545', marginLeft: '8px'}}>
                    {new Intl.NumberFormat('es-CU', {
                      style: 'currency',
                      currency: 'CUP'
                    }).format(selectedRemesa.cost)}
                  </span>
                </p>
              </div>

              <div className="detail-section">
                <h4 style={{marginBottom: '12px', color: '#333', borderBottom: '2px solid #6f42c1', paddingBottom: '5px'}}>Cliente (Remitente)</h4>
                <p style={{margin: '8px 0'}}><strong>Nombre:</strong> {selectedRemesa.client?.name || 'N/A'}</p>
                <p style={{margin: '8px 0'}}><strong>Email:</strong> {selectedRemesa.client?.email || 'N/A'}</p>
                <p style={{margin: '8px 0'}}><strong>Teléfono:</strong> {selectedRemesa.client?.phone || 'N/A'}</p>
                <p style={{margin: '8px 0'}}><strong>Dirección:</strong> {selectedRemesa.client?.address || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h4 style={{marginBottom: '12px', color: '#333', borderBottom: '2px solid #fd7e14', paddingBottom: '5px'}}>Beneficiario</h4>
                <p style={{margin: '8px 0'}}><strong>Nombre:</strong> {selectedRemesa.beneficiary?.name || 'N/A'}</p>
                <p style={{margin: '8px 0'}}><strong>Teléfono:</strong> {selectedRemesa.beneficiary?.phone || 'N/A'}</p>
                <p style={{margin: '8px 0'}}><strong>Dirección:</strong> {selectedRemesa.beneficiary?.address || 'N/A'}</p>
                {selectedRemesa.beneficiary?.cardNumber && (
                  <p style={{margin: '8px 0'}}><strong>Número de Tarjeta:</strong> {selectedRemesa.beneficiary.cardNumber}</p>
                )}
              </div>

              <div className="detail-section" style={{gridColumn: '1 / -1'}}>
                <h4 style={{marginBottom: '12px', color: '#333', borderBottom: '2px solid #20c997', paddingBottom: '5px'}}>Provincia Destino</h4>
                <div style={{display: 'flex', gap: '30px'}}>
                  <p style={{margin: '8px 0'}}><strong>Provincia:</strong> {selectedRemesa.destinationProvince?.name || 'N/A'}</p>
                  <p style={{margin: '8px 0'}}><strong>Código:</strong> {selectedRemesa.destinationProvince?.code || 'N/A'}</p>
                </div>
              </div>

              {selectedRemesa.confirmation && (
                <div className="detail-section" style={{gridColumn: '1 / -1'}}>
                  <h4 style={{marginBottom: '12px', color: '#333', borderBottom: '2px solid #17a2b8', paddingBottom: '5px'}}>Confirmación</h4>
                  <div style={{backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #dee2e6'}}>
                    <p style={{margin: 0, fontStyle: 'italic'}}>{selectedRemesa.confirmation}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions" style={{padding: '20px', borderTop: '1px solid #dee2e6'}}>
              <button 
                className="btn-secondary" 
                onClick={handleCloseRemesaDetail}
                style={{padding: '10px 20px', borderRadius: '6px', border: '1px solid #6c757d', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer'}}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagement;
