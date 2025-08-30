import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { User, Mail, Phone, Calendar, Shield, Activity, Settings, Camera, Bell } from 'lucide-react';
import { profileService, type UserProfile, type ProfileStats } from '../../services/profileService';
import { ProfileSettings } from './ProfileSettings';
import { ProfileStats as ProfileStatsComponent } from './ProfileStats';
import { NotificationSettings } from './NotificationSettings';

type TabType = 'overview' | 'settings' | 'notifications' | 'stats';

export const BuyerProfile = () => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User, gradient: 'from-blue-500 to-blue-600' },
    { id: 'stats' as TabType, label: 'Statistics', icon: Activity, gradient: 'from-purple-500 to-purple-600' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, gradient: 'from-green-500 to-green-600' },
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
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
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
            Please wait while we fetch your profile information...
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
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '32px 20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Enhanced Header Section */}
      <div style={{ 
        marginBottom: '48px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Multiple decorative elements for depth */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '20%',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #2563eb15, #7c3aed15)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '15%',
          width: '180px',
          height: '180px',
          background: 'linear-gradient(135deg, #dc262615, #2563eb15)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '250px',
          height: '250px',
          background: 'linear-gradient(135deg, #7c3aed10, #dc262610)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          zIndex: 0
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Welcome Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
            borderRadius: '25px',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2563eb',
            marginBottom: '20px',
            backdropFilter: 'blur(8px)'
          }}>
            <User style={{ width: '16px', height: '16px' }} />
            Welcome back, {profile?.firstName || 'User'}!
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 40%, #dc2626 80%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 20px 0',
            letterSpacing: '-0.04em',
            lineHeight: '1.1',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}>
            🎫 My Profile Dashboard
          </h1>
          
          <p style={{
            fontSize: 'clamp(16px, 2.2vw, 22px)',
            color: '#475569',
            margin: '0 auto 32px',
            fontWeight: '500',
            maxWidth: '800px',
            lineHeight: '1.6'
          }}>
            Manage your account, view statistics, and track your ticket offers and purchases
          </p>

          {/* Quick Stats Preview */}
          {stats && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                textAlign: 'center',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginBottom: '4px' }}>
                  {stats.totalOffers || 0}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Offers
                </div>
              </div>
              
              <div style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textAlign: 'center',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', marginBottom: '4px' }}>
                  {stats.acceptedOffers || 0}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Accepted
                </div>
              </div>

              <div style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                textAlign: 'center',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed', marginBottom: '4px' }}>
                  {formatCurrency(stats.totalSpent || 0).replace('$', '$')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Spent
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth >= 1024 ? '380px 1fr' : '1fr',
        gap: 'clamp(24px, 4vw, 40px)',
        alignItems: 'flex-start'
      }}>
        {/* Enhanced Sidebar */}
        <div style={{ 
          position: window.innerWidth >= 1024 ? 'sticky' : 'static', 
          top: '32px',
          order: window.innerWidth >= 1024 ? 0 : 1
        }}>
          {/* Profile Card */}
          <Card variant="elevated" style={{ 
            marginBottom: '28px', 
            overflow: 'visible',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{ 
              padding: 'clamp(24px, 4vw, 36px)',
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* Enhanced Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '140px',
                background: 'linear-gradient(135deg, #2563eb15 0%, #7c3aed15 50%, #dc262615 100%)',
                borderRadius: '16px 16px 0 0',
                zIndex: 0
              }} />
              
              {/* Decorative circles */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #2563eb08, #7c3aed08)',
                borderRadius: '50%',
                zIndex: 0
              }} />
              <div style={{
                position: 'absolute',
                top: '60px',
                left: '-20px',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #dc262608, #2563eb08)',
                borderRadius: '50%',
                zIndex: 0
              }} />
              
              {/* Enhanced Profile Image with Status Ring */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
                {/* Status Ring */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'calc(clamp(100px, 15vw, 140px) + 24px)',
                  height: 'calc(clamp(100px, 15vw, 140px) + 24px)',
                  borderRadius: '50%',
                  background: profile?.isEmailVerified 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  padding: '4px',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'white'
                  }} />
                </div>
                
                <div style={{
                  width: 'clamp(100px, 15vw, 140px)',
                  height: 'clamp(100px, 15vw, 140px)',
                  margin: '0 auto',
                  background: profile?.profileImage 
                    ? `url(${profile.profileImage})` 
                    : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 40%, #dc2626 80%, #f59e0b 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: '900',
                  color: 'white',
                  border: '6px solid white',
                  boxShadow: '0 20px 60px rgba(37, 99, 235, 0.3), 0 8px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}>
                  {!profile?.profileImage && getInitials(profile?.firstName, profile?.lastName)}
                </div>
                
                <button
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    width: '42px',
                    height: '42px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    zIndex: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2), 0 3px 10px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <Camera style={{ width: '18px', height: '18px', color: '#475569' }} />
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
              
              {/* Enhanced Name and Role Section */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0 0 12px 0',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}>
                  {profile?.firstName} {profile?.lastName}
                </h3>
                
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#2563eb',
                  marginBottom: '16px',
                  border: '2px solid rgba(37, 99, 235, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                }}>
                  <User style={{ width: '16px', height: '16px' }} />
                  {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1).toLowerCase() || 'Member'}
                </div>
              </div>
              
              {/* Enhanced Verification Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                {profile?.isEmailVerified ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    borderRadius: '25px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#065f46',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}>
                    <Shield style={{ width: '16px', height: '16px' }} />
                    ✓ Verified Account
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    borderRadius: '25px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#92400e',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}>
                    <Shield style={{ width: '16px', height: '16px' }} />
                    ⚠ Pending Verification
                  </div>
                )}
              </div>

              {/* Enhanced Account Info Cards */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                  borderRadius: '16px',
                  border: '2px solid rgba(37, 99, 235, 0.1)',
                  backdropFilter: 'blur(8px)',
                  textAlign: 'left'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <Calendar style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Member Since
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginLeft: '24px' }}>
                      {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                    </div>
                  </div>
                  {profile?.lastLoginAt && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <Activity style={{ width: '16px', height: '16px', color: '#10b981' }} />
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Last Active
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginLeft: '24px' }}>
                        {formatDate(profile.lastLoginAt)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Additional profile completion indicator */}
                {profile && (
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
                    borderRadius: '16px',
                    border: '2px solid rgba(168, 85, 247, 0.1)',
                    backdropFilter: 'blur(8px)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#7c3aed',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '8px'
                    }}>
                      Profile Completion
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'rgba(124, 58, 237, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: `${((profile.firstName ? 1 : 0) + (profile.lastName ? 1 : 0) + (profile.email ? 1 : 0) + (profile.phone ? 1 : 0) + (profile.profileImage ? 1 : 0)) * 20}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#7c3aed'
                    }}>
                      {((profile.firstName ? 1 : 0) + (profile.lastName ? 1 : 0) + (profile.email ? 1 : 0) + (profile.phone ? 1 : 0) + (profile.profileImage ? 1 : 0)) * 20}% Complete
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
                          ? `linear-gradient(135deg, ${tab.gradient.includes('blue') ? '#3b82f6' : tab.gradient.includes('purple') ? '#8b5cf6' : tab.gradient.includes('green') ? '#10b981' : '#f59e0b'}, ${tab.gradient.includes('blue') ? '#2563eb' : tab.gradient.includes('purple') ? '#7c3aed' : tab.gradient.includes('green') ? '#059669' : '#d97706'})`
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
        <div style={{ 
          order: window.innerWidth >= 1024 ? 1 : 0,
          minWidth: 0
        }}>
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
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
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
                      <User style={{ color: '#3b82f6', width: '24px', height: '24px' }} />
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
                      <Mail style={{ color: '#10b981', width: '24px', height: '24px' }} />
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

              {/* Enhanced Quick Stats Dashboard */}
              {!statsLoading && stats && (
                <Card variant="elevated" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  overflow: 'visible'
                }}>
                  <div style={{ padding: '40px', position: 'relative' }}>
                    {/* Background decoration */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '120px',
                      height: '120px',
                      background: 'linear-gradient(135deg, #8b5cf615, #7c3aed15)',
                      borderRadius: '50%',
                      filter: 'blur(40px)',
                      zIndex: 0
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '32px',
                        paddingBottom: '24px',
                        borderBottom: '3px solid #f1f5f9'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '20px',
                          boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1)'
                        }}>
                          <Activity style={{ color: 'white', width: '28px', height: '28px' }} />
                        </div>
                        <div>
                          <h2 style={{
                            fontSize: '28px',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            margin: '0 0 4px 0',
                            letterSpacing: '-0.02em'
                          }}>
                            📊 Dashboard Overview
                          </h2>
                          <p style={{
                            fontSize: '16px',
                            color: '#6b7280',
                            margin: 0,
                            fontWeight: '500'
                          }}>
                            Your ticket marketplace activity summary
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '24px'
                      }}>
                        <div style={{
                          padding: '28px',
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                          borderRadius: '20px',
                          border: '2px solid rgba(37, 99, 235, 0.15)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '24px'
                          }}>📈</div>
                          <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '900', 
                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '12px'
                          }}>
                            {stats.totalOffers}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#1e40af', 
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Total Offers Made
                          </div>
                        </div>

                        <div style={{
                          padding: '28px',
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                          borderRadius: '20px',
                          border: '2px solid rgba(16, 185, 129, 0.15)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '24px'
                          }}>🔥</div>
                          <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '900', 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '12px'
                          }}>
                            {stats.activeOffers}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#065f46', 
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Active Offers
                          </div>
                        </div>

                        <div style={{
                          padding: '28px',
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
                          borderRadius: '20px',
                          border: '2px solid rgba(168, 85, 247, 0.15)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '24px'
                          }}>✅</div>
                          <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '900', 
                            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '12px'
                          }}>
                            {stats.acceptedOffers}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#6b21a8', 
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Accepted Offers
                          </div>
                        </div>

                        <div style={{
                          padding: '28px',
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.05) 100%)',
                          borderRadius: '20px',
                          border: '2px solid rgba(34, 197, 94, 0.15)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '24px'
                          }}>💰</div>
                          <div style={{ 
                            fontSize: '36px', 
                            fontWeight: '900', 
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '12px'
                          }}>
                            {formatCurrency(stats.totalSpent)}
                          </div>
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#15803d', 
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Total Investment
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      marginTop: '40px', 
                      paddingTop: '32px', 
                      borderTop: '3px solid #f1f5f9',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => setActiveTab('stats')}
                          style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '200px',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.3)';
                          }}
                        >
                          <Activity style={{ width: '20px', height: '20px' }} />
                          📊 Detailed Analytics
                        </button>
                        
                        <button
                          onClick={() => window.location.href = '/my-offers'}
                          style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '200px',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(37, 99, 235, 0.3)';
                          }}
                        >
                          🎫 Manage Offers
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Enhanced Recent Activity Timeline */}
              {stats?.recentActivity && stats.recentActivity.length > 0 && (
                <Card variant="elevated" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  overflow: 'visible'
                }}>
                  <div style={{ padding: '40px', position: 'relative' }}>
                    {/* Background decoration */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '-20px',
                      width: '120px',
                      height: '120px',
                      background: 'linear-gradient(135deg, #10b98115, #05966915)',
                      borderRadius: '50%',
                      filter: 'blur(40px)',
                      zIndex: 0
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '32px',
                        paddingBottom: '24px',
                        borderBottom: '3px solid #f1f5f9'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '20px',
                          boxShadow: '0 12px 40px rgba(16, 185, 129, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1)'
                        }}>
                          <Activity style={{ color: 'white', width: '28px', height: '28px' }} />
                        </div>
                        <div>
                          <h2 style={{
                            fontSize: '28px',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            margin: '0 0 4px 0',
                            letterSpacing: '-0.02em'
                          }}>
                            🕰 Recent Activity Timeline
                          </h2>
                          <p style={{
                            fontSize: '16px',
                            color: '#6b7280',
                            margin: 0,
                            fontWeight: '500'
                          }}>
                            Your latest actions and transactions
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ position: 'relative' }}>
                        {/* Timeline line */}
                        <div style={{
                          position: 'absolute',
                          left: '32px',
                          top: '32px',
                          bottom: '32px',
                          width: '3px',
                          background: 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)',
                          borderRadius: '2px',
                          zIndex: 0
                        }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {stats.recentActivity.slice(0, 5).map((activity, index) => (
                            <div 
                              key={activity.id} 
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '20px',
                                padding: '24px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(5, 150, 105, 0.02) 100%)',
                                borderRadius: '20px',
                                border: '2px solid rgba(16, 185, 129, 0.1)',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 1,
                                marginLeft: '8px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(8px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)';
                              }}
                            >
                              {/* Timeline dot */}
                              <div style={{
                                position: 'absolute',
                                left: '-32px',
                                top: '32px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: index === 0 
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                  : index === 1
                                  ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                                  : index === 2
                                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                border: '4px solid white',
                                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                                zIndex: 2
                              }} />
                              
                              <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: index === 0 
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                  : index === 1
                                  ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                                  : index === 2
                                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                  : index === 3
                                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '24px',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
                              }}>
                                {index === 0 ? '✅' : index === 1 ? '💸' : index === 2 ? '🔄' : index === 3 ? '📅' : '🔔'}
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: '8px',
                                  gap: '16px'
                                }}>
                                  <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    margin: 0,
                                    lineHeight: '1.3'
                                  }}>
                                    {activity.description}
                                  </h3>
                                  {activity.amount && (
                                    <div style={{
                                      fontSize: '20px',
                                      fontWeight: '800',
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      backgroundClip: 'text',
                                      flexShrink: 0
                                    }}>
                                      {formatCurrency(activity.amount)}
                                    </div>
                                  )}
                                </div>
                                
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                                  <span style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    fontWeight: '600'
                                  }}>
                                    {formatDate(activity.date)}
                                  </span>
                                  
                                  {/* Activity status badge */}
                                  <div style={{
                                    marginLeft: 'auto',
                                    padding: '4px 12px',
                                    background: index === 0 
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(107, 114, 128, 0.1)',
                                    color: index === 0 ? '#065f46' : '#374151',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {index === 0 ? 'Latest' : 'Completed'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Show more button */}
                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                          <button
                            style={{
                              padding: '12px 24px',
                              fontSize: '14px',
                              fontWeight: '700',
                              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                              color: '#065f46',
                              border: '2px solid rgba(16, 185, 129, 0.2)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backdropFilter: 'blur(8px)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            View All Activity History
                          </button>
                        </div>
                      </div>
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
            <ProfileStatsComponent stats={stats} isLoading={statsLoading} />
          )}
        </div>
      </div>
      
      {/* Enhanced Global Styles and Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .profile-sidebar {
            order: 1 !important;
            position: static !important;
          }
          .profile-main {
            order: 0 !important;
          }
        }
        
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
        }
        
        /* Smooth focus states for accessibility */
        button:focus-visible,
        input:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.5) !important;
          outline-offset: 2px !important;
        }
        
        /* Enhanced mobile touch targets */
        @media (max-width: 768px) {
          button {
            min-height: 44px !important;
            min-width: 44px !important;
          }
        }
      `}</style>
    </div>
  );
};