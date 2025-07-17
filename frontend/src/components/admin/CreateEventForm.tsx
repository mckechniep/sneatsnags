import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  X,
  ImageIcon,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Event, CreateEventRequest, EventType, EventSection } from '../../types/events';

interface EventFormData {
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  category: string;
  imageUrl: string;
  capacity: number;
  sections: SectionFormData[];
}

interface SectionFormData {
  name: string;
  description: string;
  seatCount: number;
  priceLevel: number;
  rowCount: number;
}

interface CreateEventFormProps {
  event?: Event | null;
  onSubmit: (eventData: EventFormData) => Promise<void>;
  onCancel: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ event, onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>({
    name: event?.name || '',
    description: event?.description || '',
    date: event?.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
    time: event?.eventDate ? new Date(event.eventDate).toISOString().split('T')[1].slice(0, 5) : '',
    venue: event?.venue || '',
    address: event?.address || '',
    city: event?.city || '',
    state: event?.state || '',
    zipCode: event?.zipCode || '',
    country: event?.country || 'US',
    category: event?.category || 'OTHER',
    imageUrl: event?.imageUrl || '',
    capacity: event?.totalSeats || 0,
    sections: event?.sections?.map(section => ({
      name: section.name || '',
      description: section.description || '',
      seatCount: section.seatCount || 0,
      priceLevel: section.priceLevel || 0,
      rowCount: section.rowCount || 1,
    })) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(event?.imageUrl || '');

  const steps = [
    { id: 1, title: 'Basic Info', icon: '📝' },
    { id: 2, title: 'Location', icon: '📍' },
    { id: 3, title: 'Date & Time', icon: '📅' },
    { id: 4, title: 'Capacity', icon: '🎪' },
    { id: 5, title: 'Sections', icon: '🎫' },
    { id: 6, title: 'Media', icon: '🖼️' },
  ];

  const handleInputChange = (field: keyof EventFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Event name is required';
        else if (formData.name.trim().length < 3) newErrors.name = 'Event name must be at least 3 characters';
        else if (formData.name.trim().length > 200) newErrors.name = 'Event name cannot exceed 200 characters';
        
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        else if (formData.description.trim().length > 2000) newErrors.description = 'Description cannot exceed 2000 characters';
        
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      
      case 2:
        if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        break;
      
      case 3:
        if (!formData.date) newErrors.date = 'Event date is required';
        if (!formData.time) newErrors.time = 'Event time is required';
        
        if (formData.date && formData.time) {
          const eventDateTime = new Date(`${formData.date}T${formData.time}`);
          const now = new Date();
          const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
          
          if (eventDateTime <= now) {
            newErrors.date = 'Event date must be in the future';
          } else if (eventDateTime > twoYearsFromNow) {
            newErrors.date = 'Event date cannot be more than 2 years in the future';
          }
        }
        break;
      
      case 4:
        if (!formData.capacity || formData.capacity <= 0) {
          newErrors.capacity = 'Event capacity must be greater than 0';
        }
        break;
      
      case 5:
        if (formData.sections.length === 0) {
          newErrors.sections = 'At least one section is required';
        } else {
          formData.sections.forEach((section, index) => {
            if (!section.name.trim()) {
              newErrors[`section_${index}_name`] = 'Section name is required';
            }
            if (!section.seatCount || section.seatCount <= 0) {
              newErrors[`section_${index}_seatCount`] = 'Seat count must be greater than 0';
            }
            if (!section.rowCount || section.rowCount <= 0) {
              newErrors[`section_${index}_rowCount`] = 'Row count must be greater than 0';
            }
            if (section.priceLevel === undefined || section.priceLevel === null || section.priceLevel < 0) {
              newErrors[`section_${index}_priceLevel`] = 'Price level must be 0 or greater';
            }
          });
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Ensure we're on the final step
    if (currentStep !== steps.length) {
      console.warn('Cannot submit - not on final step');
      return;
    }

    // Validate all steps
    let isValid = true;
    let firstInvalidStep = null;
    
    for (let i = 1; i <= steps.length; i++) {
      if (!validateStep(i)) {
        isValid = false;
        if (firstInvalidStep === null) {
          firstInvalidStep = i;
        }
      }
    }

    if (!isValid) {
      setCurrentStep(firstInvalidStep || 1);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, {
        name: '',
        description: '',
        seatCount: 0,
        priceLevel: 0,
        rowCount: 1,
      }]
    }));
  };

  const removeSection = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      sections: prev.sections.filter((_: SectionFormData, i: number) => i !== index),
    }));
  };

  const updateSection = (index: number, field: string, value: string | number | boolean) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      sections: prev.sections.map((section: SectionFormData, i: number) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.4): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check file size limit (2MB)
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error('Image file size must be less than 2MB'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        img.onload = () => {
          // More aggressive compression for large images
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Use very aggressive compression for all images
          const finalQuality = img.width > 600 ? 0.3 : quality;
          const compressedDataUrl = canvas.toDataURL('image/jpeg', finalQuality);
          
          // Check if result is still too large (200KB limit for base64)
          if (compressedDataUrl.length > 200 * 1024) {
            reject(new Error('Image is too large even after compression. Please use a much smaller image or consider uploading to an image hosting service.'));
            return;
          }
          
          resolve(compressedDataUrl);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file, 400, 0.4);
        setPreviewImage(compressedImage);
        setFormData(prev => ({ ...prev, imageUrl: compressedImage }));
        
        // Clear any previous image errors
        if (errors.imageUrl) {
          setErrors(prev => ({ ...prev, imageUrl: '' }));
        }
      } catch (error) {
        console.error('Error processing image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
        
        // Show user-friendly error
        setErrors(prev => ({ ...prev, imageUrl: errorMessage }));
        
        // Clear the file input
        e.target.value = '';
        setPreviewImage('');
        setFormData(prev => ({ ...prev, imageUrl: '' }));
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h3>
              <p className="text-gray-600">Tell us about your event</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your event name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select category</option>
                  <option value="SPORTS">🏈 Sports</option>
                  <option value="CONCERT">🎵 Concert</option>
                  <option value="THEATER">🎭 Theater</option>
                  <option value="COMEDY">😂 Comedy</option>
                  <option value="OTHER">🎪 Other</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 resize-none ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Describe your event..."
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.description && (
                    <p className="text-red-500 text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm ml-auto">
                    {formData.description.length}/2000
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Location Details</h3>
              <p className="text-gray-600">Where is your event taking place?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.venue ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter venue name"
                />
                {errors.venue && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.venue}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter street address"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter ZIP code"
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.zipCode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400"
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Date & Time</h3>
              <p className="text-gray-600">When is your event happening?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.time ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.time && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            {formData.date && formData.time && (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-semibold text-blue-900">
                  {new Date(`${formData.date}T${formData.time}`).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-blue-700">
                  at {new Date(`${formData.date}T${formData.time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎪</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Event Capacity</h3>
              <p className="text-gray-600">What's the total capacity of your event?</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                    errors.capacity ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter total event capacity"
                  min="1"
                />
                {errors.capacity && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.capacity}
                  </p>
                )}
              </div>
              
              {formData.capacity > 0 && (
                <div className="mt-6 bg-blue-50 rounded-xl p-6 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-blue-900">
                    {formData.capacity.toLocaleString()} people
                  </p>
                  <p className="text-blue-700 text-sm">
                    Maximum event capacity
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Sections</h3>
              <p className="text-gray-600">Configure your event sections and pricing</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Sections</h4>
                <p className="text-sm text-gray-600">Add different sections with their own pricing</p>
              </div>
              <Button 
                type="button" 
                onClick={addSection} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Section
              </Button>
            </div>
            
            {errors.sections && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700 font-medium">{errors.sections}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {formData.sections.map((section, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-200 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      Section {index + 1}
                    </h5>
                    <Button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Section Name *
                      </label>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(index, 'name', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                          errors[`section_${index}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="e.g., General Admission, VIP, etc."
                      />
                      {errors[`section_${index}_name`] && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors[`section_${index}_name`]}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Seat Count *
                      </label>
                      <input
                        type="number"
                        value={section.seatCount}
                        onChange={(e) => updateSection(index, 'seatCount', parseInt(e.target.value) || 0)}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                          errors[`section_${index}_seatCount`] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors[`section_${index}_seatCount`] && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors[`section_${index}_seatCount`]}
                        </p>
                      )}
                    </div>
                    
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Row Count *
                      </label>
                      <input
                        type="number"
                        value={section.rowCount}
                        onChange={(e) => updateSection(index, 'rowCount', parseInt(e.target.value) || 0)}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                          errors[`section_${index}_rowCount`] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="1"
                        min="1"
                      />
                      {errors[`section_${index}_rowCount`] && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors[`section_${index}_rowCount`]}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price Level *
                      </label>
                      <input
                        type="number"
                        value={section.priceLevel}
                        onChange={(e) => updateSection(index, 'priceLevel', parseFloat(e.target.value) || 0)}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 ${
                          errors[`section_${index}_priceLevel`] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {errors[`section_${index}_priceLevel`] && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors[`section_${index}_priceLevel`]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={section.description}
                      onChange={(e) => updateSection(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400 resize-none"
                      placeholder="Section description (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>

            {formData.sections.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">🎫</div>
                <p className="text-gray-600 mb-4">No sections added yet</p>
                <Button 
                  type="button" 
                  onClick={addSection}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Section
                </Button>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🖼️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Event Image</h3>
              <p className="text-gray-600">Add a compelling image for your event</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              {previewImage ? (
                <div className="space-y-4 text-center">
                  <div className="relative inline-block">
                    <img 
                      src={previewImage} 
                      alt="Event preview" 
                      className="w-full max-w-md h-64 object-cover rounded-xl shadow-lg"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        setPreviewImage('');
                        setFormData(prev => ({ ...prev, imageUrl: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Click below to change image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-input"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('image-upload-input')?.click()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-200">
                  <div className="space-y-4">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Upload an image</p>
                      <p className="text-sm text-gray-600">PNG, JPG, GIF up to 2MB (will be compressed)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-input-empty"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('image-upload-input-empty')?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                </div>
              )}
              
              {errors.imageUrl && (
                <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700 font-medium">{errors.imageUrl}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-gray-600">
            {event ? 'Update your event details' : 'Set up your event in a few easy steps'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-all duration-200 ${
                  step.id === currentStep 
                    ? 'bg-blue-500 text-white shadow-lg scale-110' 
                    : step.id < currentStep 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    step.id === currentStep ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded-full ${
                    step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </Button>

            <div className="flex space-x-4">
              <Button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </Button>

              {currentStep === steps.length ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      {event ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {event ? 'Update Event' : 'Create Event'}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventForm;