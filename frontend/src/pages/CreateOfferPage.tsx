import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreateOfferForm } from '../components/offers/CreateOfferForm';
import type { Event } from '../types/events';
import { eventService } from '../services/eventService';

export const CreateOfferPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        const event = await eventService.getEvent(eventId);
        setEvent(event);
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const handleSuccess = (offer: any) => {
    navigate(`/offers/${offer.id}`, { 
      state: { message: 'Offer created successfully!' }
    });
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          borderRadius: '20px',
          padding: '48px 32px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
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
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Loading Event Details
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0,
            fontWeight: '500'
          }}>
            Please wait while we prepare your offer form...
          </p>
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
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          borderRadius: '20px',
          padding: '48px 32px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '48px'
          }}>
            ⚠️
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1f2937',
            margin: '0 0 12px 0'
          }}>
            Event Not Found
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 32px 0',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            {error || 'The event you are looking for does not exist or may have been removed.'}
          </p>
          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.6)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
            }}
          >
            🎟️ Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '32px 20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '40px',
          position: 'relative'
        }}>
          {/* Background decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, #2563eb15, #7c3aed15, #dc262615)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <button
              onClick={handleCancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#2563eb',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '24px',
                padding: '12px 20px',
                background: 'rgba(37, 99, 235, 0.1)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ← Back to Event
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 16px 0',
                letterSpacing: '-0.02em'
              }}>
                🎯 Make an Offer
              </h1>
              <p style={{
                fontSize: 'clamp(16px, 2vw, 20px)',
                color: '#475569',
                margin: '0 auto',
                fontWeight: '500',
                maxWidth: '600px',
                lineHeight: '1.6'
              }}>
                Create an offer for tickets to this event. Sellers will be notified and can accept your offer directly.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <CreateOfferForm
          event={event}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};