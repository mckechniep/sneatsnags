import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventSearchQuery,
  EventFilters,
  EventState,
  EventAction,
  UseEventManagementReturn,
  DEFAULT_FILTERS,
} from '../types/events';
import { eventService, EventServiceError, handleEventServiceError } from '../services/eventService';
import { useAuth } from './AuthContext';

// Initial state
const initialState: EventState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  sortBy: 'eventDate',
  sortOrder: 'asc',
};

// Event reducer
const eventReducer = (state: EventState, action: EventAction): EventState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_EVENTS':
      return { ...state, events: action.payload, loading: false, error: null };
    
    case 'SET_CURRENT_EVENT':
      return { ...state, currentEvent: action.payload, loading: false, error: null };
    
    case 'ADD_EVENT':
      return {
        ...state,
        events: [action.payload, ...state.events],
        loading: false,
        error: null,
      };
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
        currentEvent: state.currentEvent?.id === action.payload.id ? action.payload : state.currentEvent,
        loading: false,
        error: null,
      };
    
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        currentEvent: state.currentEvent?.id === action.payload ? null : state.currentEvent,
        loading: false,
        error: null,
      };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };
    
    case 'SET_SORTING':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Context
const EventContext = createContext<UseEventManagementReturn | null>(null);

// Provider props
interface EventProviderProps {
  children: React.ReactNode;
}

// Provider component
export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const { user } = useAuth();

  // Load events with current filters and pagination
  const loadEvents = useCallback(async (query?: EventSearchQuery) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const searchQuery: EventSearchQuery = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...state.filters,
        ...query,
      };

      // Remove empty values
      const cleanQuery = Object.fromEntries(
        Object.entries(searchQuery).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      const response = await eventService.getEvents(cleanQuery);
      
      dispatch({ type: 'SET_EVENTS', payload: response.data || [] });
      dispatch({ type: 'SET_PAGINATION', payload: response.pagination });
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to load events');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.pagination.page, state.pagination.limit, state.sortBy, state.sortOrder, state.filters]);

  // Load single event
  const loadEvent = useCallback(async (id: string, includeStats = false): Promise<Event | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const event = await eventService.getEventById(id, includeStats);
      dispatch({ type: 'SET_CURRENT_EVENT', payload: event });
      return event;
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to load event');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    }
  }, []);

  // Create event
  const createEvent = useCallback(async (data: CreateEventRequest): Promise<Event> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const event = await eventService.createEvent(data);
      dispatch({ type: 'ADD_EVENT', payload: event });
      return event;
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to create event');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // Update event
  const updateEvent = useCallback(async (id: string, data: UpdateEventRequest): Promise<Event> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const event = await eventService.updateEvent(id, data);
      dispatch({ type: 'UPDATE_EVENT', payload: event });
      return event;
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to update event');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // Delete event
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await eventService.deleteEvent(id);
      dispatch({ type: 'DELETE_EVENT', payload: id });
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to delete event');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // Search events
  const searchEvents = useCallback(async (query: string): Promise<Event[]> => {
    try {
      const events = await eventService.searchEvents(query, {
        limit: 20,
        ...state.filters,
      });
      return events;
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to search events');
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return [];
    }
  }, [state.filters]);

  // Set filters
  const setFilters = useCallback((filters: Partial<EventFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    // Reset to first page when filters change
    dispatch({ type: 'SET_PAGINATION', payload: { ...state.pagination, page: 1 } });
  }, [state.pagination]);

  // Set sorting
  const setSorting = useCallback((sortBy: EventSearchQuery['sortBy'], sortOrder: EventSearchQuery['sortOrder']) => {
    dispatch({ type: 'SET_SORTING', payload: { sortBy, sortOrder } });
    // Reset to first page when sorting changes
    dispatch({ type: 'SET_PAGINATION', payload: { ...state.pagination, page: 1 } });
  }, [state.pagination]);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Auto-load events when dependencies change
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Context value
  const value: UseEventManagementReturn = {
    state,
    actions: {
      loadEvents,
      loadEvent,
      createEvent,
      updateEvent,
      deleteEvent,
      searchEvents,
      setFilters,
      setSorting,
      resetState,
    },
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

// Hook to use event context
export const useEvents = (): UseEventManagementReturn => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

// Hook for admin-only operations
export const useEventAdmin = () => {
  const context = useEvents();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const adminActions = {
    ...context.actions,
    createEvent: isAdmin ? context.actions.createEvent : async () => { throw new Error('Admin access required'); },
    updateEvent: isAdmin ? context.actions.updateEvent : async () => { throw new Error('Admin access required'); },
    deleteEvent: isAdmin ? context.actions.deleteEvent : async () => { throw new Error('Admin access required'); },
  };

  return {
    ...context,
    actions: adminActions,
    isAdmin,
  };
};

// Hook for popular events
export const usePopularEvents = (limit = 10) => {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadPopularEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const popularEvents = await eventService.getPopularEvents(limit);
      setEvents(popularEvents);
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to load popular events');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadPopularEvents();
  }, [loadPopularEvents]);

  return { events, loading, error, reload: loadPopularEvents };
};

// Hook for upcoming events
export const useUpcomingEvents = (limit = 10, city?: string, state?: string) => {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadUpcomingEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const upcomingEvents = await eventService.getUpcomingEvents(limit, city, state);
      setEvents(upcomingEvents);
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to load upcoming events');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, city, state]);

  useEffect(() => {
    loadUpcomingEvents();
  }, [loadUpcomingEvents]);

  return { events, loading, error, reload: loadUpcomingEvents };
};

// Hook for event statistics
export const useEventStats = (eventId: string) => {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const eventStats = await eventService.getEventStats(eventId);
      setStats(eventStats);
    } catch (error) {
      const errorMessage = handleEventServiceError(error, 'Failed to load event statistics');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, reload: loadStats };
};

// Hook for debounced search
export const useEventSearch = (delay = 300) => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const searchResults = await eventService.searchEvents(searchQuery);
        setResults(searchResults);
      } catch (error) {
        const errorMessage = handleEventServiceError(error, 'Failed to search events');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return { query, setQuery, results, loading, error };
};

// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export default EventContext;