import React, { useState, useEffect } from 'react';
import './OfertaRecargasManagement.css';

interface Bono {
    titulo: string;
    tipo: 'Minutos' | 'Mensajes' | 'Datos';
}

interface OfertaRecarga {
    _id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    costo: number;
    bonos: Bono[];
    activa: boolean;
    createdAt: string;
    updatedAt: string;
}

const OfertaRecargasManagement: React.FC = () => {
    const [ofertas, setOfertas] = useState<OfertaRecarga[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedOferta, setSelectedOferta] = useState<OfertaRecarga | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        precio: 0,
        costo: 0,
        bonos: [] as Bono[],
        activa: true
    });

    useEffect(() => {
        loadOfertas();
    }, []);

    const loadOfertas = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('cubana_auth') || '{}').token;
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ofertas-recargas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setOfertas(data);
        } catch (error) {
            console.error('Error cargando ofertas:', error);
            setError('Error cargando ofertas');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'precio' || name === 'costo' ? parseFloat(value) || 0 : value
        }));
    };

    const handleBonoChange = (index: number, field: keyof Bono, value: any) => {
        const newBonos = [...formData.bonos];
        newBonos[index] = {
            ...newBonos[index],
            [field]: value
        };
        setFormData(prev => ({ ...prev, bonos: newBonos }));
    };

    const addBono = () => {
        setFormData(prev => ({
            ...prev,
            bonos: [...prev.bonos, { titulo: '', tipo: 'Minutos' }]
        }));
    };

    const removeBono = (index: number) => {
        setFormData(prev => ({
            ...prev,
            bonos: prev.bonos.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');
            
            const token = JSON.parse(localStorage.getItem('cubana_auth') || '{}').token;
            const url = selectedOferta 
                ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ofertas-recargas/${selectedOferta._id}`
                : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ofertas-recargas`;
            
            const method = selectedOferta ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess(selectedOferta ? 'Oferta actualizada exitosamente' : 'Oferta creada exitosamente');
                setShowCreateForm(false);
                setShowEditForm(false);
                setSelectedOferta(null);
                resetForm();
                loadOfertas();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Error al guardar la oferta');
            }
        } catch (error) {
            console.error('Error guardando oferta:', error);
            setError('Error al guardar la oferta');
        }
    };

    const handleEdit = (oferta: OfertaRecarga) => {
        setSelectedOferta(oferta);
        setFormData({
            titulo: oferta.titulo,
            descripcion: oferta.descripcion,
            precio: oferta.precio,
            costo: oferta.costo,
            bonos: oferta.bonos,
            activa: oferta.activa
        });
        setShowEditForm(true);
    };

    const handleDelete = (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDelete = async (id: string) => {
        try {
            const token = JSON.parse(localStorage.getItem('cubana_auth') || '{}').token;
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ofertas-recargas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setSuccess('Oferta eliminada exitosamente');
                setShowDeleteConfirm(null);
                loadOfertas();
            } else {
                setError('Error al eliminar la oferta');
            }
        } catch (error) {
            console.error('Error eliminando oferta:', error);
            setError('Error al eliminar la oferta');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const token = JSON.parse(localStorage.getItem('cubana_auth') || '{}').token;
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ofertas-recargas/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                loadOfertas();
            } else {
                setError('Error al cambiar estado de la oferta');
            }
        } catch (error) {
            console.error('Error cambiando estado:', error);
            setError('Error al cambiar estado de la oferta');
        }
    };

    const resetForm = () => {
        setFormData({
            titulo: '',
            descripcion: '',
            precio: 0,
            costo: 0,
            bonos: [],
            activa: true
        });
    };

    const closeModal = () => {
        setShowCreateForm(false);
        setShowEditForm(false);
        setSelectedOferta(null);
        setShowDeleteConfirm(null);
        resetForm();
        setError('');
        setSuccess('');
    };

    if (loading) {
        return <div className="loading">Cargando ofertas...</div>;
    }

    return (
        <div className="oferta-recargas-management">
            <div className="header">
                <h2>Gestión de Ofertas de Recargas</h2>
                <button 
                    className="btn-primary"
                    onClick={() => setShowCreateForm(true)}
                >
                    + Nueva Oferta
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="ofertas-list">
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Precio</th>
                            <th>Costo</th>
                            <th>Bonos</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ofertas.map(oferta => (
                            <tr key={oferta._id}>
                                <td>{oferta.titulo}</td>
                                <td>${oferta.precio.toFixed(2)}</td>
                                <td>${oferta.costo.toFixed(2)}</td>
                                <td>
                                    <div className="bonos-list">
                                        {oferta.bonos.map((bono, index) => (
                                            <span key={index} className="bono-tag">
                                                {bono.titulo} ({bono.tipo})
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${oferta.activa ? 'active' : 'inactive'}`}>
                                        {oferta.activa ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className="btn-edit"
                                        onClick={() => handleEdit(oferta)}
                                        title="Editar oferta"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="btn-toggle"
                                        onClick={() => handleToggle(oferta._id)}
                                        title={oferta.activa ? 'Desactivar' : 'Activar'}
                                    >
                                        {oferta.activa ? '🔴' : '🟢'}
                                    </button>
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDelete(oferta._id)}
                                        title="Eliminar oferta"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal para crear/editar oferta */}
            {(showCreateForm || showEditForm) && (
                <div className="modal-overlay" style={{zIndex: 9999}}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{selectedOferta ? 'Editar Oferta' : 'Nueva Oferta'}</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="oferta-form">
                            <div className="form-group">
                                <label htmlFor="titulo">Título *</label>
                                <input
                                    type="text"
                                    id="titulo"
                                    name="titulo"
                                    value={formData.titulo}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="descripcion">Descripción *</label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={1000}
                                    rows={4}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="precio">Precio *</label>
                                    <input
                                        type="number"
                                        id="precio"
                                        name="precio"
                                        value={formData.precio}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="costo">Costo *</label>
                                    <input
                                        type="number"
                                        id="costo"
                                        name="costo"
                                        value={formData.costo}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                    <span className="description">Se eliminará automaticamente cuando se confirme del saldo de la provincia</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Bonos</label>
                                {formData.bonos.map((bono, index) => (
                                    <div key={index} className="bono-item">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    placeholder="Título del bono"
                                                    value={bono.titulo}
                                                    onChange={(e) => handleBonoChange(index, 'titulo', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <select
                                                    value={bono.tipo}
                                                    onChange={(e) => handleBonoChange(index, 'tipo', e.target.value)}
                                                    required
                                                >
                                                    <option value="Minutos">Minutos</option>
                                                    <option value="Mensajes">Mensajes</option>
                                                    <option value="Datos">Datos</option>
                                                </select>
                                            </div>
                                             <div className="form-group">
                                                <button 
                                                    type="button"
                                                    className="btn-remove"
                                                    onClick={() => removeBono(index)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    type="button"
                                    className="btn-add"
                                    onClick={addBono}
                                >
                                    + Agregar Bono
                                </button>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {selectedOferta ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar */}
            {showDeleteConfirm && (
                <div className="modal-overlay" style={{zIndex: 9999}}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Confirmar Eliminación</h3>
                            <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>¿Está seguro que desea eliminar esta oferta?</p>
                            <p>Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-delete" 
                                onClick={() => confirmDelete(showDeleteConfirm)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfertaRecargasManagement;
