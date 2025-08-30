import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { User, Mail, Phone, Calendar, Shield, Activity, Settings, Camera, Bell, DollarSign, Package, TrendingUp, Eye } from 'lucide-react';
import { profileService, type UserProfile, type ProfileStats } from '../../services/profileService';
import { ProfileSettings } from './ProfileSettings';
import { NotificationSettings } from './NotificationSettings';
import { sellerService } from '../../services/sellerService';

type TabType = 'overview' | 'settings' | 'notifications' | 'stats';

export const SellerProfile = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showImageUpload, setShowImageUpload] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: ['profile-stats'],
    queryFn: () => profileService.getProfileStats(),
  });

  // Get seller-specific stats
  const { data: sellerStats, isLoading: sellerStatsLoading } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const listings = await sellerService.getListings({ limit: 1000 });
      return {
        totalListings: listings.data.length,
        activeListings: listings.data.filter(l => l.status === 'ACTIVE' || l.status === 'AVAILABLE').length,
        soldListings: listings.data.filter(l => l.status === 'SOLD').length,
        totalRevenue: listings.data
          .filter(l => l.status === 'SOLD')
          .reduce((sum, l) => sum + (l.price * l.quantity), 0),
        averagePrice: listings.data.length > 0 
          ? listings.data.reduce((sum, l) => sum + l.price, 0) / listings.data.length 
          : 0,
        recentListings: listings.data.slice(0, 5),
      };
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await profileService.uploadProfileImage(file);
      // Refresh profile data
      window.location.reload();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User, gradient: 'from-green-500 to-green-600' },
    { id: 'stats' as TabType, label: 'Statistics', icon: Activity, gradient: 'from-purple-500 to-purple-600' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, gradient: 'from-blue-500 to-blue-600' },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell, gradient: 'from-orange-500 to-orange-600' },
  ];

  if (profileLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '24px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '4px solid white',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Loading Profile
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#6b7280',
            fontSize: '16px'
          }}>
            Please wait while we fetch your seller profile information...
          </p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.7; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em'
        }}>
          Seller Dashboard
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          margin: 0,
          fontWeight: '500',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Manage your seller account, track your performance, and monitor your ticket sales
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '32px',
        alignItems: 'flex-start'
      }}>
        {/* Sidebar */}
        <div style={{ position: 'sticky', top: '32px' }}>
          {/* Profile Card */}
          <Card variant="elevated" style={{ marginBottom: '24px', overflow: 'visible' }}>
            <div style={{ 
              padding: '32px',
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '120px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px 16px 0 0',
                opacity: 0.1
              }} />
              
              {/* Profile Image */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto',
                  background: profile?.profileImage 
                    ? `url(${profile.profileImage})` 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'white',
                  border: '4px solid white',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {!profile?.profileImage && getInitials(profile?.firstName, profile?.lastName)}
                </div>
                
                <button
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease',
                    zIndex: 3
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Camera style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                </button>
                
                {showImageUpload && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '12px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e5e7eb',
                    padding: '16px',
                    zIndex: 10,
                    minWidth: '200px'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Upload Profile Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        width: '100%',
                        fontSize: '12px',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                )}
              </div>
              
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                {profile?.firstName} {profile?.lastName}
              </h3>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#ecfdf5',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#065f46',
                marginBottom: '16px'
              }}>
                <Package style={{ width: '14px', height: '14px' }} />
                {profile?.role.toLowerCase()}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                {profile?.isEmailVerified ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#065f46'
                  }}>
                    <Shield style={{ width: '14px', height: '14px' }} />
                    Verified Account
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#92400e'
                  }}>
                    <Shield style={{ width: '14px', height: '14px' }} />
                    Unverified
                  </div>
                )}
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Member Since
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                    {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                  </div>
                </div>
                {profile?.lastLoginAt && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Last Active
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {formatDate(profile.lastLoginAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card variant="elevated">
            <div style={{ padding: '8px' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        fontSize: '15px',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: 'none',
                        background: isActive 
                          ? `linear-gradient(135deg, ${tab.gradient.includes('green') ? '#10b981' : tab.gradient.includes('purple') ? '#8b5cf6' : tab.gradient.includes('blue') ? '#3b82f6' : '#f59e0b'}, ${tab.gradient.includes('green') ? '#059669' : tab.gradient.includes('purple') ? '#7c3aed' : tab.gradient.includes('blue') ? '#2563eb' : '#d97706'})`
                          : 'transparent',
                        color: isActive ? 'white' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.color = '#1f2937';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon style={{ width: '18px', height: '18px' }} />
                      </div>
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Basic Information */}
              <Card variant="elevated">
                <div style={{ padding: '32px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '24px',
                    paddingBottom: '20px',
                    borderBottom: '2px solid #f1f5f9'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                    }}>
                      <User style={{ color: 'white', width: '24px', height: '24px' }} />
                    </div>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: 0
                    }}>
                      Basic Information
                    </h2>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <User style={{ color: '#10b981', width: '24px', height: '24px' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Full Name
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {profile?.firstName} {profile?.lastName}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Mail style={{ color: '#3b82f6', width: '24px', height: '24px' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Email Address
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {profile?.email}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Phone style={{ color: '#8b5cf6', width: '24px', height: '24px' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Phone Number
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {profile?.phone || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Calendar style={{ color: '#f59e0b', width: '24px', height: '24px' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Member Since
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '32px', 
                    paddingTop: '24px', 
                    borderTop: '2px solid #f1f5f9',
                    textAlign: 'center'
                  }}>
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={() => setActiveTab('settings')}
                      style={{ minWidth: '200px' }}
                    >
                      <Settings style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Seller Performance Stats */}
              {!sellerStatsLoading && sellerStats && (
                <Card variant="elevated">
                  <div style={{ padding: '32px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '24px',
                      paddingBottom: '20px',
                      borderBottom: '2px solid #f1f5f9'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px',
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                      }}>
                        <TrendingUp style={{ color: 'white', width: '24px', height: '24px' }} />
                      </div>
                      <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Seller Performance
                      </h2>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '24px'
                    }}>
                      <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        borderRadius: '16px',
                        border: '2px solid #93c5fd'
                      }}>
                        <div style={{ 
                          fontSize: '32px', 
                          fontWeight: '800', 
                          color: '#2563eb',
                          marginBottom: '8px'
                        }}>
                          {sellerStats.totalListings}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#1e40af', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Total Listings
                        </div>
                      </div>

                      <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                        borderRadius: '16px',
                        border: '2px solid #a7f3d0'
                      }}>
                        <div style={{ 
                          fontSize: '32px', 
                          fontWeight: '800', 
                          color: '#059669',
                          marginBottom: '8px'
                        }}>
                          {sellerStats.activeListings}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#065f46', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Active Listings
                        </div>
                      </div>

                      <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
                        borderRadius: '16px',
                        border: '2px solid #c4b5fd'
                      }}>
                        <div style={{ 
                          fontSize: '32px', 
                          fontWeight: '800', 
                          color: '#7c3aed',
                          marginBottom: '8px'
                        }}>
                          {sellerStats.soldListings}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#6b21a8', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Sold Listings
                        </div>
                      </div>

                      <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        borderRadius: '16px',
                        border: '2px solid #86efac'
                      }}>
                        <div style={{ 
                          fontSize: '32px', 
                          fontWeight: '800', 
                          color: '#16a34a',
                          marginBottom: '8px'
                        }}>
                          {formatPrice(sellerStats.totalRevenue)}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#15803d', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Total Revenue
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      marginTop: '32px', 
                      paddingTop: '24px', 
                      borderTop: '2px solid #f1f5f9',
                      textAlign: 'center'
                    }}>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setActiveTab('stats')}
                        style={{ minWidth: '240px' }}
                      >
                        <Activity style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                        View Detailed Statistics
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Recent Listings */}
              {sellerStats?.recentListings && sellerStats.recentListings.length > 0 && (
                <Card variant="elevated">
                  <div style={{ padding: '32px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '24px',
                      paddingBottom: '20px',
                      borderBottom: '2px solid #f1f5f9'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px',
                        boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                      }}>
                        <Package style={{ color: 'white', width: '24px', height: '24px' }} />
                      </div>
                      <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        Recent Listings
                      </h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {sellerStats.recentListings.slice(0, 5).map((listing: any) => (
                        <div 
                          key={listing.id} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Package style={{ color: 'white', width: '20px', height: '20px' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#1f2937',
                              margin: '0 0 4px 0'
                            }}>
                              {listing.event?.name || 'Unknown Event'}
                            </p>
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              margin: 0
                            }}>
                              Qty: {listing.quantity} • {listing.status}
                            </p>
                          </div>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#10b981',
                            flexShrink: 0
                          }}>
                            {formatPrice(listing.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <ProfileSettings profile={profile} />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettings />
          )}

          {activeTab === 'stats' && (
            <div>
              {/* Render detailed stats component */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};