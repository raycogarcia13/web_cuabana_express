import React, { useState, useEffect, lazy, Suspense, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';
import ProvinceManagement from './ProvinceManagement';
import './Home.css';
import financeService from '../services/financeService';
import clientService from '../services/clientService';
const RemesaManagement = lazy(() => import('./RemesaManagement'));
const ClientManagement = lazy(() => import('./ClientManagement'));
const Recargas = lazy(() => import('./Recargas'));
const FinanceManagement = lazy(() => import('./FinanceManagement'));
const OfertaRecargasManagement = lazy(() => import('./OfertaRecargasManagement'));

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: string;
  roles?: string[];
  parent?: string;
}

const Home: React.FC = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState({
    total: 0,
    remesas: 0,
    recargas: 0,
    clientes: 0
  });

  const [workerData, setWorkerData] = useState({
    remesas: 0,
    recargas: 0,
    pendingRemesas: [],
    pendingRecargas: []
  });

  const [showRemesaConfirmModal, setShowRemesaConfirmModal] = useState(false);
  const [showRecargaConfirmModal, setShowRecargaConfirmModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [operationDetails, setOperationDetails] = useState<any>(null);
  
  // Estados para el histórico
  const [historicoData, setHistoricoData] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [adminSubItems, setAdminSubItems] = useState([
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'provincias', label: 'Provincias', icon: '📍' },
    { id: 'finanzas', label: 'Finanzas', icon: '💰' },
    { id: 'ofertas-recargas', label: 'Ofertas de Recargas', icon: '📱' }
  ]);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: '🏠',
      path: '/dashboard',
    },
    {
      id: 'remesas',
      label: 'Remesas',
      icon: '💰',
      path: '/remesas',
      permission: 'view_remittances',
      roles: ['admin', 'worker'],
    },
    {
      id: 'recargas',
      label: 'Recargas',
      icon: '📱',
      path: '/recargas',
      permission: 'view_remittances',
      roles: ['admin', 'worker'],
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: '👥',
      path: '/clientes',
      permission: 'view_clients',
      roles: ['admin', 'worker'],
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: '⚙️',
      path: '/admin',
      roles: ['admin'],
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: '👨‍💼',
      path: '/admin/usuarios',
      permission: 'manage_users',
      roles: ['admin'],
      parent: 'admin',
    },
    {
      id: 'provincias',
      label: 'Provincias',
      icon: '📍',
      path: '/admin/provincias',
      permission: 'manage_provinces',
      roles: ['admin'],
      parent: 'admin',
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      icon: '💵',
      path: '/admin/finanzas',
      permission: 'manage_finances',
      roles: ['admin'],
      parent: 'admin',
    },
    {
      id: 'ofertas-recargas',
      label: 'Ofertas de Recargas',
      icon: '📱',
      path: '/admin/ofertas-recargas',
      permission: 'manage_offers',
      roles: ['admin'],
      parent: 'admin',
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: '📋',
      path: '/historico',
      roles: ['admin', 'worker'],
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Para workers, solo mostrar Inicio y Histórico
    if (user?.role === 'worker') {
      return item.id === 'dashboard' || item.id === 'historico';
    }
    
    // Verificar permisos
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    // Verificar roles
    if (item.roles && !item.roles.some(role => hasRole(role))) {
      return false;
    }
    
    return true;
  });

  const mainMenuItems = filteredMenuItems.filter(item => !item.parent);

  const handleLogout = async () => {
    await logout();
  };

  const handleMenuClick = (itemId: string) => {
    if (itemId === 'admin') {
      // Si no hay sub-tab activo, mostrar el primer sub-item
      if (!activeSubTab && adminSubItems.length > 0) {
        setActiveSubTab(adminSubItems[0].id);
      }
      setActiveTab(itemId);
    } else if (itemId === 'usuarios') {
      setActiveTab('admin');
      setActiveSubTab('usuarios');
    } else {
      setActiveTab(itemId);
      setActiveSubTab(null);
    }
  };

  const handleSubMenuClick = (itemId: string) => {
    setActiveSubTab(itemId);
  };

  const handleOpenRemesaConfirm = (remesa: any) => {
    setSelectedOperation(remesa);
    setConfirmationText('');
    setShowRemesaConfirmModal(true);
  };

  const handleOpenRecargaConfirm = (recarga: any) => {
    setSelectedOperation(recarga);
    setConfirmationText('');
    setShowRecargaConfirmModal(true);
  };

  const loadHistoricoData = async () => {
    if (!user?.province) return;
    
    try {
      setLoadingHistorico(true);
      
      // Cargar remesas históricas de la provincia del usuario
      const remesasResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/remesas/provincia/${user.province}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`
        }
      });
      
      // Cargar recargas históricas de la provincia del usuario
      const recargasResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/recargas/provincia/${user.province}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`
        }
      });
      
      const remesasData = remesasResponse.ok ? await remesasResponse.json() : [];
      const recargasData = recargasResponse.ok ? await recargasResponse.json() : [];
      
      // Combinar y ordenar por fecha (más reciente primero)
      const allOperations = [
        ...remesasData.map((r: any) => ({ ...r, type: 'remesa' })),
        ...recargasData.map((r: any) => ({ ...r, type: 'recarga' }))
      ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistoricoData(allOperations);
    } catch (error) {
      console.error('Error cargando histórico:', error);
      setHistoricoData([]);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleShowOperationDetails = (operation: any) => {
    setOperationDetails(operation);
    setShowOperationDetails(true);
  };

  // Función para filtrar datos históricos
  const filteredHistoricoData = historicoData.filter((operation: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const dateStr = new Date(operation.date).toLocaleDateString('es-CU');
    const typeStr = operation.type === 'remesa' ? 'remesa' : 'recarga';
    const clientStr = operation.client?.name || operation.phone || '';
    const amountStr = operation.amount?.toString() || '';
    const costStr = operation.cost?.toString() || '';
    const provinceStr = operation.destinationProvince?.name || '';
    const statusStr = operation.status || '';
    
    return (
      dateStr.toLowerCase().includes(searchLower) ||
      typeStr.toLowerCase().includes(searchLower) ||
      clientStr.toLowerCase().includes(searchLower) ||
      amountStr.toLowerCase().includes(searchLower) ||
      costStr.toLowerCase().includes(searchLower) ||
      provinceStr.toLowerCase().includes(searchLower) ||
      statusStr.toLowerCase().includes(searchLower)
    );
  });

  // Lógica de paginación
  const totalPages = Math.ceil(filteredHistoricoData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistoricoData.slice(startIndex, endIndex);

  // Funciones para manejar paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleConfirmRemesa = async () => {
    if (!selectedOperation || !confirmationText.trim()) {
      alert('Por favor ingrese el texto de confirmación');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/remesas/${selectedOperation._id}/confirmar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: confirmationText })
      });

      if (response.ok) {
        // Update local state
        const updatedPendingRemesas = workerData.pendingRemesas.filter((r: any) => r._id !== selectedOperation._id);
        setWorkerData(prev => ({
          ...prev,
          pendingRemesas: updatedPendingRemesas,
          remesas: prev.remesas + 1
        }));
        
        setShowRemesaConfirmModal(false);
        setSelectedOperation(null);
        setConfirmationText('');
      } else {
        alert('Error al confirmar remesa');
      }
    } catch (error) {
      console.error('Error confirming remesa:', error);
      alert('Error al confirmar remesa');
    }
  };

  const handleConfirmRecarga = async () => {
    if (!selectedOperation || !confirmationText.trim()) {
      alert('Por favor ingrese el texto de confirmación');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/recargas/${selectedOperation._id}/confirmar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: confirmationText })
      });

      if (response.ok) {
        // Update local state
        const updatedPendingRecargas = workerData.pendingRecargas.filter((r: any) => r._id !== selectedOperation._id);
        setWorkerData(prev => ({
          ...prev,
          pendingRecargas: updatedPendingRecargas,
          recargas: prev.recargas + 1
        }));
        
        setShowRecargaConfirmModal(false);
        setSelectedOperation(null);
        setConfirmationText('');
      } else {
        alert('Error al confirmar recarga');
      }
    } catch (error) {
      console.error('Error confirming recarga:', error);
      alert('Error al confirmar recarga');
    }
  };

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        const [status, clientsCount] = await Promise.all([
          financeService.getFinancialStatus(),
          clientService.getClientsCount()
        ]);
        
        // Calculate totals
        const remesas = status.byProvince.reduce(
          (sum: number, item: any) => sum + item.movements.filter((m: any) => m.type === 'remesa').length, 0
        );
        
        const recargas = status.byProvince.reduce(
          (sum: number, item: any) => sum + item.movements.filter((m: any) => m.type === 'recarga').length, 0
        );

        setFinancialData({
          total: status.total || 0,
          remesas,
          recargas,
          clientes: clientsCount
        });
      } catch (error) {
        console.error('Error loading financial data:', error);
      }
    };

    const loadWorkerData = async () => {
      try {
        if (!user?.province) return;
        
        const [remesasResponse, recargasResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/remesas/provincia/${user.province}`, {
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/recargas/provincia/${user.province}`, {
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cubana_auth') || '{}').token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        const remesas = await remesasResponse.json();
        const recargas = await recargasResponse.json();

        const pendingRemesas = remesas.filter((r: any) => r.status === 'Pendiente');
        const pendingRecargas = recargas.filter((r: any) => r.status === 'Pendiente');
        
        const confirmedRemesas = remesas.filter((r: any) => r.status === 'Realizado');
        const confirmedRecargas = recargas.filter((r: any) => r.status === 'Realizado');

        setWorkerData({
          remesas: confirmedRemesas.length,
          recargas: confirmedRecargas.length,
          pendingRemesas,
          pendingRecargas
        });
      } catch (error) {
        console.error('Error loading worker data:', error);
      }
    };

    if (user?.role === 'admin') {
      loadFinancialData();
    } else if (user?.role === 'worker') {
      loadWorkerData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'historico' && user?.role === 'worker') {
      loadHistoricoData();
    }
  }, [activeTab, user?.province, user?.role]);

  useEffect(() => {
    // Resetear a la página 1 cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const getDashboardContent = () => {
    if (user?.role === 'admin') {
      return (
        <div className="stats-grid">
          {/* Total Money Card */}
          <div className="stat-card total-money">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Total en Caja</h3>
              <p className="stat-number">
                {new Intl.NumberFormat('es-CU', {
                  style: 'currency',
                  currency: 'CUP'
                }).format(financialData.total)}
              </p>
            </div>
          </div>

          {/* Remesas Card */}
          <div className="stat-card">
            <div className="stat-icon">💵	</div>
            <div className="stat-info">
              <h3>Remesas</h3>
              <p className="stat-number">{financialData.remesas}</p>
              <p className="stat-label">Total procesadas</p>
            </div>
          </div>

          {/* Recargas Card */}
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-info">
              <h3>Recargas</h3>
              <p className="stat-number">{financialData.recargas}</p>
              <p className="stat-label">Total realizadas</p>
            </div>
          </div>

          {/* Clientes Card */}
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Clientes</h3>
              <p className="stat-number">{financialData.clientes}</p>
              <p className="stat-label">Registrados</p>
            </div>
          </div>
        </div>
      );
    } else if (user?.role === 'worker') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>Remesas</h3>
                <p className="stat-number">{workerData.remesas}</p>
                <p className="stat-label">Confirmadas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📱</div>
              <div className="stat-info">
                <h3>Recargas</h3>
                <p className="stat-number">{workerData.recargas}</p>
                <p className="stat-label">Confirmadas</p>
              </div>
            </div>
          </div>

          {/* Pending Operations Section */}
          <div className="pending-operations" style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Operaciones Pendientes</h3>
            
            {/* Pending Remesas */}
            {workerData.pendingRemesas.length > 0 && (
              <div className="pending-section">
                <h4 style={{ color: '#007bff', marginBottom: '15px' }}>Remesas Pendientes</h4>
                <table className="pending-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', backgroundColor: '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Cliente</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Monto</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Fecha</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerData.pendingRemesas.map((remesa: any, index: number) => (
                      <tr key={remesa._id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{remesa.client?.name || 'N/A'}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>${remesa.amount?.toFixed(2) || '0.00'}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{new Date(remesa.date).toLocaleDateString('es-CU')}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                          <button 
                            className="btn-primary btn-small"
                            onClick={() => handleOpenRemesaConfirm(remesa)}
                            style={{ backgroundColor: '#28a745', fontSize: '12px', padding: '6px 12px' }}
                          >
                            Confirmar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pending Recargas */}
            {workerData.pendingRecargas.length > 0 && (
              <div className="pending-section" style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#28a745', marginBottom: '15px' }}>Recargas Pendientes</h4>
                <table className="pending-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', backgroundColor: '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Cliente</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Teléfono</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Oferta</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Monto</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Fecha</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerData.pendingRecargas.map((recarga: any, index: number) => (
                      <tr key={recarga._id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{recarga.client?.name || 'N/A'}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{recarga.phone}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{recarga.oferta?.titulo || 'N/A'}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>${recarga.amount?.toFixed(2) || '0.00'}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{new Date(recarga.date).toLocaleDateString('es-CU')}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                          <button 
                            className="btn-primary btn-small"
                            onClick={() => handleOpenRecargaConfirm(recarga)}
                            style={{ backgroundColor: '#28a745', fontSize: '12px', padding: '6px 12px' }}
                          >
                            Confirmar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* No pending operations */}
            {workerData.pendingRemesas.length === 0 && workerData.pendingRecargas.length === 0 && (
              <div className="no-pending" style={{ 
                textAlign: 'center', 
                padding: '40px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                color: '#666'
              }}>
                <p style={{ fontSize: '18px', margin: 0 }}>🎉</p>
                <p style={{ fontSize: '16px', margin: '10px 0 0 0' }}>No hay operaciones pendientes</p>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Cliente
      return (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Mis Remesas</h3>
              <p className="stat-number">5</p>
              <p className="stat-label">Este mes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>Mis Paquetes</h3>
              <p className="stat-number">2</p>
              <p className="stat-label">En tránsito</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-info">
              <h3>Saldo</h3>
              <p className="stat-number">$1,250</p>
              <p className="stat-label">Disponible</p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2>Bienvenido, {user?.name}</h2>
            {getDashboardContent()}
          </div>
        );
      case 'admin':
        if (activeSubTab === 'usuarios') {
          return <UserManagement />;
        } else if (activeSubTab === 'provincias') {
          return <ProvinceManagement />;
        } else if (activeSubTab === 'finanzas') {
          return <FinanceManagement />;
        } else if (activeSubTab === 'ofertas-recargas') {
          return <OfertaRecargasManagement />;
        } else if (adminSubItems.length > 0) {
          return <div>Seleccione una opción del menú de administración</div>;
        }
        return <div>No tiene permisos para acceder a esta sección</div>;
      case 'remesas':
        return <RemesaManagement />;
      case 'clientes':
        return <ClientManagement />;
      case 'recargas':
        return <Recargas />;
      case 'historico':
        if (user?.role === 'worker') {
          return (
            <div className="section-content">
              <h2>Histórico de Operaciones</h2>
              
              {/* Buscador */}
              <div className="search-container" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Buscar por cualquier campo (fecha, tipo, cliente, monto, costo, provincia, estado)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              {loadingHistorico ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando histórico...</p>
                </div>
              ) : filteredHistoricoData.length === 0 ? (
                <div className="no-pending">
                  <p>No hay operaciones históricas que coincidan con la búsqueda.</p>
                </div>
              ) : (
                <>
                  <div className="remesas-table-container">
                    <table className="remesas-table">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Monto</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((operation: any) => (
                          <tr key={operation._id}>
                            <td>
                              <span className={`status-badge ${operation.type === 'remesa' ? 'completed type-remesa' : 'pending type-recarga'}`}>
                                {operation.type === 'remesa' ? 'Remesa' : 'Recarga'}
                              </span>
                            </td>
                            <td>{new Date(operation.date).toLocaleDateString('es-CU')}</td>
                            <td>{operation.client?.name || operation.phone || 'N/A'}</td>
                            <td className="amount">${operation.type === 'recarga' ? operation.oferta.costo?.toFixed(2) : operation.amount?.toFixed(2) || '0.00'}</td>
                            <td className="actions">
                              <button 
                                className="action-btn confirm"
                                onClick={() => handleShowOperationDetails(operation)}
                                title="Ver detalles"
                              >
                                📋 Detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Controles de paginación */}
                  {totalPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        <span>
                          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredHistoricoData.length)} de {filteredHistoricoData.length} resultados
                        </span>
                      </div>
                      <div className="pagination-controls">
                        <button 
                          className="pagination-btn"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                        >
                          ← Anterior
                        </button>
                        
                        <span className="pagination-pages">
                          Página {currentPage} de {totalPages}
                        </span>
                        
                        <button 
                          className="pagination-btn"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }
        return <div>No tiene permisos para acceder a esta sección</div>;
      default:
        return getDashboardContent();
    }
  };

  return (
    <Fragment>
      <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>Cubana Express</h1>
          <div className="user-info">
            <span className="user-avatar">{user?.name?.charAt(0)}</span>
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              🚪
            </button>
          </div>
        </div>
      </header>

      <div className="content">
        {renderContent()}
      </div>

      <nav className="bottom-nav">
        {mainMenuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleMenuClick(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        {activeTab === 'admin' && (
          <div className="sub-menu-container">
            {adminSubItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item sub-menu-item ${activeSubTab === item.id ? 'active' : ''}`}
                onClick={() => handleSubMenuClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                </button>
            ))}
          </div>
        )}
    </nav>
    </div>

    {/* Modals */}
    <Fragment>
      {/* Modal para confirmar remesa */}
      {showRemesaConfirmModal && selectedOperation && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal-content" style={{padding:10}}>
            <div className="modal-header">
              <h3>Confirmar Remesa</h3>
              <button className="modal-close" onClick={() => setShowRemesaConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="remesa-details">
                <p><strong>Cliente:</strong> {selectedOperation.client?.name || 'N/A'}</p>
                <p><strong>Beneficiario:</strong> {selectedOperation.beneficiary?.name || 'N/A'}</p>
                {selectedOperation.beneficiary?.phone && (
                  <p><strong>Teléfono:</strong> {selectedOperation.beneficiary.phone}</p>
                )}
                {selectedOperation.beneficiary?.cardNumber && (
                  <p><strong>Número de Tarjeta:</strong> {selectedOperation.beneficiary.cardNumber}</p>
                )}
                <p><strong>Monto:</strong> ${selectedOperation.amount?.toFixed(2) || '0.00'}</p>
                <p><strong>Costo:</strong> ${selectedOperation.cost?.toFixed(2) || '0.00'}</p>
                <p><strong>Provincia Destino:</strong> {selectedOperation.destinationProvince?.name || 'N/A'}</p>
                <p><strong>Descripción:</strong> {selectedOperation.description || 'N/A'}</p>
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
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                style={{background:'#ba3539'}}
                className="btn-secondary" 
                onClick={() => setShowRemesaConfirmModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleConfirmRemesa}
                disabled={!confirmationText.trim()}
              >
                Confirmar Remesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar recarga */}
      {showRecargaConfirmModal && selectedOperation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{padding:'10px'}}>
            <div className="modal-header">
              <h3>Confirmar Recarga</h3>
              <button className="modal-close" onClick={() => setShowRecargaConfirmModal(false)}>×</button>
            </div>
            <div className="remesa-details">
              <p><strong>Cliente:</strong> {selectedOperation.client?.name || 'N/A'}</p>
              <p><strong>Oferta:</strong> {selectedOperation.oferta?.titulo || 'N/A'}</p>
              {selectedOperation.oferta?.bonos && selectedOperation.oferta.bonos.length > 0 && (
                <div>
                  <strong>Bonos incluidos:</strong>
                  <div className="bonos-list">
                    {selectedOperation.oferta.bonos.map((bono: any, index: number) => (
                      <span key={index} className="bono-tag">
                        {bono.titulo} ({bono.tipo})
                      </span>
                    ))}
                  </div>
                  <ul className="bonos-list-detail">
                    {selectedOperation.oferta.bonos.map((bono: any, index: number) => (
                      <li key={index}>
                        <strong>{bono.titulo}</strong> - Tipo: {bono.tipo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p><strong>Teléfono:</strong> {selectedOperation.phone}</p>
              <p><strong>Monto:</strong> ${selectedOperation.amount?.toFixed(2) || '0.00'}</p>
              <p><strong>Provincia Destino:</strong> {selectedOperation.destinationProvince?.name || 'N/A'}</p>
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
              <button type="button" className="btn-secondary" onClick={() => setShowRecargaConfirmModal(false)}>
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

      {/* Modal para ver detalles de operación */}
    {showOperationDetails && operationDetails && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal-content" style={{maxWidth: '700px', width: '90%', padding:'10px'}}>
            <div className="modal-header">
              <h3>Detalles de {operationDetails.phone ? 'Recarga' : 'Remesa'}</h3>
              <button className="modal-close" onClick={() => setShowOperationDetails(false)}>×</button>
            </div>
            <div style={{padding: '20px'}}>
              {operationDetails.phone ? (
                // Recarga Details
                <div className="recarga-details">
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Columna Izquierda */}
                    <div style={{ flex: 1 }}>
                      <p><strong>Cliente:</strong> {operationDetails.client?.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {operationDetails.client?.email || 'N/A'}</p>
                      <p><strong>Teléfono:</strong> {operationDetails.phone}</p>
                      <p><strong>Oferta:</strong> {operationDetails.oferta?.titulo || 'N/A'}</p>
                      <p><strong>Descripción de Oferta:</strong> {operationDetails.oferta?.descripcion || 'N/A'}</p>
                    </div>
                    
                    {/* Columna Derecha */}
                    <div style={{ flex: 1 }}>
                      <p><strong>Costo:</strong> ${operationDetails.oferta?.costo?.toFixed(2) || '0.00'}</p>
                      {operationDetails.oferta?.bonos && operationDetails.oferta.bonos.length > 0 && (
                        <div style={{ textAlign: 'center' }}>
                          <strong>Bonos:</strong>
                          <div className="bonos-list" style={{ justifyContent: 'center', marginTop: '10px' }}>
                            {operationDetails.oferta.bonos.map((bono: any, index: number) => (
                              <span key={index} className="bono-tag">
                                {bono.titulo} ({bono.tipo})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p><strong>Fecha:</strong> {new Date(operationDetails.date).toLocaleDateString('es-CU')}</p>
                      <p><strong>Estado:</strong> {operationDetails.status}</p>
                      <p><strong>Confirmación:</strong> {operationDetails.confirmation || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Remesa Details - Igual al modal de confirmación de remesas
                <div className="remesa-details">
                  <p><strong>Cliente:</strong> {operationDetails.client?.name || 'N/A'}</p>
                  <p><strong>Beneficiario:</strong> {operationDetails.beneficiary?.name || 'N/A'}</p>
                  {operationDetails.beneficiary?.phone && (
                    <p><strong>Teléfono:</strong> {operationDetails.beneficiary.phone}</p>
                  )}
                  {operationDetails.beneficiary?.cardNumber && (
                    <p><strong>Número de Tarjeta:</strong> {operationDetails.beneficiary.cardNumber}</p>
                  )}
                  <p><strong>Monto:</strong> ${operationDetails.amount?.toFixed(2) || '0.00'}</p>
                  <p><strong>Costo:</strong> ${operationDetails.cost?.toFixed(2) || '0.00'}</p>
                  <p><strong>Provincia Destino:</strong> {operationDetails.destinationProvince?.name || 'N/A'}</p>
                  <p><strong>Descripción:</strong> {operationDetails.description || 'N/A'}</p>
                  <p><strong>Confirmación:</strong> {operationDetails.confirmation || 'N/A'}</p>
                  <p><strong>Estado:</strong> {operationDetails.status}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setShowOperationDetails(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
  )}
</Fragment>
</Fragment>
);
};

export default Home;