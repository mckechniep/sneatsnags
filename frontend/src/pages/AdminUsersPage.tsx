import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Edit,
  ArrowLeft,
  Download,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { adminService } from '../services/adminService';
import { SweetAlert } from '../utils/sweetAlert';
import type { User, UserRole } from '../types/auth';
import type { PaginatedResponse } from '../types/api';

export const AdminUsersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDropdownId, setShowDropdownId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<User> = await adminService.getAllUsers({
        page: currentPage,
        limit: 20,
        role: selectedRole || undefined,
        isActive: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
        search: searchQuery || undefined,
      });

      setUsers(response.data || []);
      setTotalUsers(response.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setTotalUsers(0);
      // Show error message to user
      SweetAlert.error('Failed to load users', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedRole, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole, selectedStatus, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdownId && !(event.target as Element)?.closest('[data-dropdown]')) {
        setShowDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdownId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleDeactivateUser = async (userId: string) => {
    const confirmed = await SweetAlert.confirm(
      'Deactivate User?',
      'Are you sure you want to deactivate this user? They will lose access to the platform.'
    );
    
    if (!confirmed) return;

    try {
      await adminService.deactivateUser(userId, 'Admin deactivation');
      await fetchUsers(); // Refresh the users list
      SweetAlert.success('User Deactivated', 'User has been deactivated successfully');
    } catch (err) {
      console.error('Failed to deactivate user:', err);
      SweetAlert.error('Failed to deactivate user', 'Please try again.');
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      await adminService.reactivateUser(userId);
      await fetchUsers(); // Refresh the users list
      SweetAlert.success('User Reactivated', 'User has been reactivated successfully');
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      SweetAlert.error('Failed to reactivate user', 'Please try again.');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return;

    try {
      await adminService.updateUser(editingUser.id, userData);
      await fetchUsers(); // Refresh the users list
      setShowEditModal(false);
      setEditingUser(null);
      SweetAlert.success('User Updated', 'User has been updated successfully');
    } catch (err) {
      console.error('Failed to update user:', err);
      SweetAlert.error('Failed to update user', 'Please try again.');
    }
  };

  const exportUsers = async () => {
    try {
      const result = await adminService.exportData({
        type: 'users',
        format: 'csv',
      });
      
      // Open the export URL in a new tab
      window.open(result.url, '_blank');
      SweetAlert.success('Export Started', 'Users export has been initiated successfully');
    } catch (err) {
      console.error('Failed to export users:', err);
      SweetAlert.error('Failed to export users', 'Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'BUYER': return 'bg-blue-100 text-blue-800';
      case 'SELLER': return 'bg-green-100 text-green-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalUsers / 20);

  if (loading && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(135deg, #2563eb15, #7c3aed15)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '5%',
        width: '250px',
        height: '250px',
        background: 'linear-gradient(135deg, #dc262615, #7c3aed15)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        zIndex: 0
      }} />
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Professional Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div style={{ position: 'relative' }}>
              {/* Background glow */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                right: '-10px',
                bottom: '-10px',
                background: 'linear-gradient(135deg, #2563eb10, #7c3aed10)',
                borderRadius: '20px',
                filter: 'blur(20px)',
                zIndex: -1
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Link
                  to="/admin/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '12px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => (e.target as HTMLElement).style.color = '#374151'}
                  onMouseOut={(e) => (e.target as HTMLElement).style.color = '#6b7280'}
                >
                  <ArrowLeft style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                  Back to Dashboard
                </Link>
                <h1 style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  User Management
                </h1>
                <p style={{
                  color: '#64748b',
                  fontSize: '18px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  {totalUsers.toLocaleString()} total users registered
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => fetchUsers()}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: loading ? '#f3f4f6' : 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(229, 231, 235, 0.8)',
                  borderRadius: '12px',
                  color: loading ? '#9ca3af' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLElement;
                    target.style.transform = 'translateY(-1px)';
                    target.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLElement;
                    target.style.transform = 'translateY(0)';
                    target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <RefreshCw style={{ height: '16px', width: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={() => exportUsers()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.transform = 'translateY(-1px)';
                  target.style.boxShadow = '0 8px 15px -3px rgba(37, 99, 235, 0.4)';
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)';
                }}
              >
                <Download style={{ height: '16px', width: '16px' }} />
                Export Users
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)')}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #3b82f620, #2563eb20)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)',
              zIndex: 0
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Users style={{ height: '32px', width: '32px', color: '#3b82f6' }} />
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users style={{ height: '16px', width: '16px', color: 'white' }} />
                </div>
              </div>
              <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Users</h3>
              <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold', margin: 0, fontFamily: 'system-ui' }}>
                {totalUsers.toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)')}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #10b98120, #059b6920)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)',
              zIndex: 0
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <UserCheck style={{ height: '32px', width: '32px', color: '#10b981' }} />
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserCheck style={{ height: '16px', width: '16px', color: 'white' }} />
                </div>
              </div>
              <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Users</h3>
              <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold', margin: 0, fontFamily: 'system-ui' }}>
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)')}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #ef444420, #dc262620)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)',
              zIndex: 0
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <UserX style={{ height: '32px', width: '32px', color: '#ef4444' }} />
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserX style={{ height: '16px', width: '16px', color: 'white' }} />
                </div>
              </div>
              <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Inactive Users</h3>
              <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold', margin: 0, fontFamily: 'system-ui' }}>
                {users.filter(u => !u.isActive).length}
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)')}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #64748b20, #47556920)',
              borderRadius: '50%',
              transform: 'translate(30px, -30px)',
              zIndex: 0
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Filter style={{ height: '32px', width: '32px', color: '#64748b' }} />
                <div style={{
                  background: 'linear-gradient(135deg, #64748b, #475569)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Filter style={{ height: '16px', width: '16px', color: 'white' }} />
                </div>
              </div>
              <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Current Page</h3>
              <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold', margin: 0, fontFamily: 'system-ui' }}>
                {users.length}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '12px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Search style={{ height: '20px', width: '20px', color: 'white' }} />
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>
              Search & Filter Users
            </h2>
          </div>

          <form onSubmit={handleSearch}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  letterSpacing: '0.025em'
                }}>
                  Search Users
                </label>
                <div style={{ position: 'relative' }}>
                  <Search style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    height: '16px',
                    width: '16px'
                  }} />
                  <input
                    type="text"
                    placeholder="Name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      border: '1px solid rgba(209, 213, 219, 0.8)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      backgroundColor: 'rgba(249, 250, 251, 0.5)',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(209, 213, 219, 0.8)';
                      e.target.style.backgroundColor = 'rgba(249, 250, 251, 0.5)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  letterSpacing: '0.025em'
                }}>
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(209, 213, 219, 0.8)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(209, 213, 219, 0.8)';
                    e.target.style.backgroundColor = 'rgba(249, 250, 251, 0.5)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="BUYER">Buyers</option>
                  <option value="SELLER">Sellers</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  letterSpacing: '0.025em'
                }}>
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(209, 213, 219, 0.8)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(209, 213, 219, 0.8)';
                    e.target.style.backgroundColor = 'rgba(249, 250, 251, 0.5)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = 'translateY(-1px)';
                    target.style.boxShadow = '0 8px 15px -3px rgba(37, 99, 235, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = 'translateY(0)';
                    target.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)';
                  }}
                >
                  <Filter style={{ height: '16px', width: '16px' }} />
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Users Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivateUser(user.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <div style={{ position: 'relative' }} data-dropdown>
                        <button
                          onClick={() => setShowDropdownId(showDropdownId === user.id ? null : user.id)}
                          className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        
                        {showDropdownId === user.id && (
                          <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '4px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e5e7eb',
                            zIndex: 10,
                            minWidth: '160px'
                          }}>
                            <div style={{ padding: '4px' }}>
                              <button
                                onClick={() => {
                                  handleEditUser(user);
                                  setShowDropdownId(null);
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  fontSize: '14px',
                                  color: '#374151',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseOver={(e) => (e.target as HTMLElement).style.background = '#f3f4f6'}
                                onMouseOut={(e) => (e.target as HTMLElement).style.background = 'transparent'}
                              >
                                <Edit style={{ height: '16px', width: '16px' }} />
                                Edit User
                              </button>
                              
                              {user.isActive ? (
                                <button
                                  onClick={() => {
                                    handleDeactivateUser(user.id);
                                    setShowDropdownId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    color: '#dc2626',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                  onMouseOver={(e) => (e.target as HTMLElement).style.background = '#fef2f2'}
                                  onMouseOut={(e) => (e.target as HTMLElement).style.background = 'transparent'}
                                >
                                  <UserX style={{ height: '16px', width: '16px' }} />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleReactivateUser(user.id);
                                    setShowDropdownId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    color: '#059669',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                  onMouseOver={(e) => (e.target as HTMLElement).style.background = '#f0fdf4'}
                                  onMouseOut={(e) => (e.target as HTMLElement).style.background = 'transparent'}
                                >
                                  <UserCheck style={{ height: '16px', width: '16px' }} />
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}
        </div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 50
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingUser(null);
              }
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '24px 32px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    Edit User
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Update user information and settings
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  style={{
                    color: '#9ca3af',
                    fontSize: '24px',
                    transition: 'color 0.2s ease',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  onMouseOver={(e) => (e.target as HTMLElement).style.color = '#6b7280'}
                  onMouseOut={(e) => (e.target as HTMLElement).style.color = '#9ca3af'}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const userData = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  role: formData.get('role') as UserRole,
                };
                handleUpdateUser(userData);
              }}>
                <div style={{ padding: '32px' }}>
                  <div style={{
                    display: 'grid',
                    gap: '24px'
                  }}>
                    {/* User Avatar */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '32px',
                          fontWeight: 'bold'
                        }}>
                          {editingUser.firstName?.charAt(0) || editingUser.email?.charAt(0) || '?'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        User ID: {editingUser.id}
                      </p>
                    </div>

                    {/* Form Fields */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '20px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          defaultValue={editingUser.firstName || ''}
                          required
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.2s ease'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          defaultValue={editingUser.lastName || ''}
                          required
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.2s ease'
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={editingUser.email || ''}
                          required
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.2s ease'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Role
                        </label>
                        <select
                          name="role"
                          defaultValue={editingUser.role}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.2s ease'
                          }}
                        >
                          <option value="BUYER">Buyer</option>
                          <option value="SELLER">Seller</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Status
                        </label>
                        <div style={{
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {editingUser.isActive ? (
                            <>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                background: '#10b981',
                                borderRadius: '50%'
                              }} />
                              <span style={{ color: '#10b981' }}>Active</span>
                            </>
                          ) : (
                            <>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                background: '#ef4444',
                                borderRadius: '50%'
                              }} />
                              <span style={{ color: '#ef4444' }}>Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div style={{
                      background: '#f9fafb',
                      borderRadius: '8px',
                      padding: '16px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div><strong>Joined:</strong> {formatDate(editingUser.createdAt)}</div>
                        <div><strong>Last Login:</strong> {editingUser.lastLoginAt ? formatDate(editingUser.lastLoginAt) : 'Never'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '24px 32px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};