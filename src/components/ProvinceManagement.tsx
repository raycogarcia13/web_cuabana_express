import React, { useState, useEffect } from 'react';
import provinceService, { Province, CreateProvinceData, UpdateProvinceData } from '../services/provinceService';
import userService from '../services/userService';
import './ProvinceManagement.css';

const ProvinceManagement: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddProvince, setShowAddProvince] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [provincesData, workersData] = await Promise.all([
        provinceService.getAllProvinces(),
        userService.getUsersByRole('worker')
      ]);

      provincesData.forEach(province => {
        province.workers = workersData.filter(worker => worker.province === province._id);
      });

      setProvinces(provincesData);
      setWorkers(workersData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProvinces = provinces.filter(province => {
    const matchesSearch = province.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         province.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddProvince = async (provinceData: any) => {
    try {
      setError('');
      // Remover _id si existe para crear nueva provincia
      const { _id, ...createData } = provinceData;
      const newProvince = await provinceService.createProvince(createData);
      setProvinces([...provinces, newProvince]);
      setShowAddProvince(false);
    } catch (error: any) {
      setError(error.message || 'Error creando provincia');
    }
  };

  const handleEditProvince = (province: Province) => {
    setEditingProvince(province);
  };

  const handleUpdateProvince = async (updatedProvince: any) => {
    try {
      setError('');
      const { _id, ...updateData } = updatedProvince;
      if (!_id) {
        setError('ID de provincia no encontrado');
        return;
      }
      const updatedProvinceData = await provinceService.updateProvince(_id, updateData);
      setProvinces(provinces.map(province => province._id === _id ? updatedProvinceData : province));
      setEditingProvince(null);
    } catch (error: any) {
      setError(error.message || 'Error actualizando provincia');
    }
  };

  const handleDeleteProvince = async (provinceId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta provincia?')) {
      try {
        setError('');
        await provinceService.deleteProvince(provinceId);
        setProvinces(provinces.filter(province => province._id !== provinceId));
      } catch (error: any) {
        setError(error.message || 'Error eliminando provincia');
      }
    }
  };

  const openWorkersModal = async (province: Province) => {
    try {
      setSelectedProvince(province);
      setShowWorkersModal(true);
    } catch (error: any) {
      setError(error.message || 'Error cargando trabajadores');
    }
  };

  const handleAssignWorker = async (workerId: string) => {
    if (!selectedProvince) return;
    
    try {
      setError('');
      await provinceService.assignWorkerToProvince(selectedProvince._id, workerId);
      // Recargar la provincia para obtener los trabajadores actualizados
      const updatedProvince = await provinceService.getProvinceById(selectedProvince._id);
      setProvinces(provinces.map(p => p._id === selectedProvince._id ? updatedProvince : p));
      setSelectedProvince(updatedProvince);
    } catch (error: any) {
      setError(error.message || 'Error asignando trabajador');
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (!selectedProvince) return;
    
    try {
      setError('');
      await provinceService.removeWorkerFromProvince(selectedProvince._id, workerId);
      // Recargar la provincia para obtener los trabajadores actualizados
      const updatedProvince = await provinceService.getProvinceById(selectedProvince._id);
      setProvinces(provinces.map(p => p._id === selectedProvince._id ? updatedProvince : p));
      setSelectedProvince(updatedProvince);
    } catch (error: any) {
      setError(error.message || 'Error removiendo trabajador');
    }
  };

  const getStatusBadgeClass = (active: boolean) => {
    return active ? 'status-badge active' : 'status-badge inactive';
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
      <div className="province-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando provincias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="province-management-container">
      <div className="province-management-header">
        <h2>Gestión de Provincias</h2>
        <button 
          className="add-province-btn"
          onClick={() => setShowAddProvince(true)}
        >
          <span className="btn-icon">+</span>
          Agregar Provincia
        </button>
      </div>

      <div className="province-management-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar provincias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="provinces-table-container">
        <table className="provinces-table">
          <thead>
            <tr>
              <th>Provincia</th>
              <th>Código</th>
              <th>Estado</th>
              <th>Trabajadores</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProvinces.map(province => (
              <tr key={province._id}>
                <td className="province-info">
                  <div className="province-avatar">
                    {province.name.charAt(0)}
                  </div>
                  <div className="province-details">
                    <span className="province-name">{province.name}</span>
                    <span className="province-date">Creado: {formatDate(province.createdAt)}</span>
                  </div>
                </td>
                <td className="province-code">{province.code}</td>
                <td>
                  <span className={getStatusBadgeClass(province.active)}>
                    {province.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="workers-count">
                  {province.workers.length} trabajador{province.workers.length !== 1 ? 'es' : ''}
                </td>
                <td className="created-date">
                  {formatDate(province.createdAt)}
                </td>
                <td className="actions">
                  <button
                    className="action-btn workers"
                    onClick={() => openWorkersModal(province)}
                    title="Gestionar trabajadores"
                  >
                    👥
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditProvince(province)}
                    title="Editar provincia"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteProvince(province._id)}
                    title="Eliminar provincia"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProvinces.length === 0 && (
        <div className="no-provinces">
          <p>No se encontraron provincias que coincidan con los filtros.</p>
        </div>
      )}

      {/* Modal para agregar/editar provincia */}
      {(showAddProvince || editingProvince) && (
        <ProvinceModal
          province={editingProvince}
          onSave={editingProvince ? handleUpdateProvince : handleAddProvince}
          onCancel={() => {
            setShowAddProvince(false);
            setEditingProvince(null);
          }}
        />
      )}

      {/* Modal para gestionar trabajadores */}
      {showWorkersModal && selectedProvince && (
        <WorkersModal
          province={selectedProvince}
          workers={workers}
          onAssign={handleAssignWorker}
          onRemove={handleRemoveWorker}
          onCancel={() => {
            setShowWorkersModal(false);
            setSelectedProvince(null);
          }}
        />
      )}
    </div>
  );
};

// Componente modal para agregar/editar provincias
interface ProvinceModalProps {
  province?: Province | null;
  onSave: (provinceData: any) => void;
  onCancel: () => void;
}

const ProvinceModal: React.FC<ProvinceModalProps> = ({ province, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    _id: province?._id || '',
    name: province?.name || '',
    code: province?.code || '',
    active: province?.active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{province ? 'Editar Provincia' : 'Agregar Provincia'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="province-form">
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
            <label htmlFor="code">Código *</label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              required
              maxLength={3}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
              <span className="checkmark"></span>
              Provincia Activa
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {province ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente modal para gestionar trabajadores
interface WorkersModalProps {
  province: Province;
  workers: any[];
  onAssign: (workerId: string) => void;
  onRemove: (workerId: string) => void;
  onCancel: () => void;
}

const WorkersModal: React.FC<WorkersModalProps> = ({ province, workers, onAssign, onRemove, onCancel }) => {
  const assignedWorkers = workers.filter(worker => 
    province.workers.some(provinceWorker => 
      provinceWorker._id === worker._id
    )
  );
  
  const availableWorkers = workers.filter(worker => 
    !province.workers.some(provinceWorker => 
      provinceWorker._id === worker._id
    )
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Trabajadores de {province.name}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="workers-modal-content">
          <div className="workers-section">
            <h4>Trabajadores Asignados ({assignedWorkers.length})</h4>
            <div className="workers-list">
              {assignedWorkers.map(worker => (
                <div key={worker._id} className="worker-item">
                  <div className="worker-info">
                    <span className="worker-name">{worker.name}</span>
                    <span className="worker-email">{worker.email}</span>
                  </div>
                  <button
                    className="btn-danger small"
                    onClick={() => onRemove(worker._id)}
                    title="Remover trabajador"
                  >
                    Remover
                  </button>
                </div>
              ))}
              {assignedWorkers.length === 0 && (
                <p className="no-workers">No hay trabajadores asignados</p>
              )}
            </div>
          </div>
          
          <div className="workers-section">
            <h4>Trabajadores Disponibles ({availableWorkers.length})</h4>
            <div className="workers-list">
              {availableWorkers.map(worker => (
                <div key={worker._id} className="worker-item">
                  <div className="worker-info">
                    <span className="worker-name">{worker.name}</span>
                    <span className="worker-email">{worker.email}</span>
                  </div>
                  <button
                    className="btn-primary small"
                    onClick={() => onAssign(worker._id)}
                    title="Asignar trabajador"
                  >
                    Asignar
                  </button>
                </div>
              ))}
              {availableWorkers.length === 0 && (
                <p className="no-workers">No hay trabajadores disponibles</p>
              )}
            </div>
          </div>
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

export default ProvinceManagement; 