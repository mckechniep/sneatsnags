import Swal from 'sweetalert2';

export class SweetAlert {
  // Success alerts
  static success(title: string, message?: string, timer = 3000) {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer,
      showConfirmButton: false,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'colored-toast'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.position = 'fixed';
          popup.style.top = '100px';
          popup.style.right = '20px';
          popup.style.left = 'auto';
          popup.style.transform = 'none';
          popup.style.margin = '0';
          popup.style.borderRadius = '16px';
          popup.style.background = 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)';
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.border = '1px solid rgba(16, 185, 129, 0.2)';
          popup.style.minWidth = '350px';
          popup.style.maxWidth = '450px';
          popup.style.padding = '20px 24px';
        }
        
        // Ensure auto-close after timer
        if (timer && timer > 0) {
          setTimeout(() => {
            if (Swal.isVisible()) {
              Swal.close();
            }
          }, timer);
        }
      }
    });
  }

  // Error alerts
  static error(title: string, message?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc2626',
      customClass: {
        popup: 'error-popup'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.borderRadius = '16px';
          popup.style.background = 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)';
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.border = '1px solid rgba(220, 38, 38, 0.2)';
          popup.style.minWidth = '400px';
        }
      }
    });
  }

  // Warning alerts
  static warning(title: string, message?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#f59e0b',
      customClass: {
        popup: 'warning-popup'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.borderRadius = '16px';
          popup.style.background = 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)';
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.border = '1px solid rgba(245, 158, 11, 0.2)';
          popup.style.minWidth = '400px';
        }
      }
    });
  }

  // Info alerts
  static info(title: string, message?: string) {
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
      customClass: {
        popup: 'info-popup'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.borderRadius = '16px';
          popup.style.background = 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)';
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.border = '1px solid rgba(37, 99, 235, 0.2)';
          popup.style.minWidth = '400px';
        }
      }
    });
  }

  // Confirmation dialogs
  static confirm(title: string, message?: string, confirmText = 'Yes', cancelText = 'No') {
    return Swal.fire({
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#dc2626',
      customClass: {
        popup: 'confirm-popup'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.borderRadius = '16px';
          popup.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.border = '1px solid rgba(107, 114, 128, 0.2)';
          popup.style.minWidth = '400px';
        }
      }
    });
  }

  // Loading alerts
  static loading(title: string, message?: string) {
    return Swal.fire({
      title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.borderRadius = '16px';
          popup.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.border = '1px solid rgba(37, 99, 235, 0.2)';
          popup.style.minWidth = '400px';
        }
        Swal.showLoading();
      },
      customClass: {
        popup: 'loading-popup'
      }
    });
  }

  // Close any open alert
  static close() {
    Swal.close();
  }

  // Toast notifications
  static toast(icon: 'success' | 'error' | 'warning' | 'info', title: string, timer = 3000) {
    return Swal.fire({
      icon,
      title,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'colored-toast'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.zIndex = '99999';
          popup.style.position = 'fixed';
          popup.style.top = '100px';
          popup.style.right = '20px';
          popup.style.left = 'auto';
          popup.style.transform = 'none';
          popup.style.margin = '0';
          popup.style.borderRadius = '16px';
          popup.style.backdropFilter = 'blur(12px)';
          popup.style.minWidth = '350px';
          popup.style.maxWidth = '450px';
          popup.style.padding = '20px 24px';
          
          // Apply different backgrounds based on the icon type
          const backgroundColors = {
            success: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            error: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
            warning: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
            info: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)'
          };
          
          const borderColors = {
            success: '1px solid rgba(16, 185, 129, 0.2)',
            error: '1px solid rgba(220, 38, 38, 0.2)',
            warning: '1px solid rgba(245, 158, 11, 0.2)',
            info: '1px solid rgba(37, 99, 235, 0.2)'
          };
          
          popup.style.background = backgroundColors[icon] || backgroundColors.info;
          popup.style.border = borderColors[icon] || borderColors.info;
          popup.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)';
        }
        
        // Ensure auto-close after timer
        if (timer && timer > 0) {
          setTimeout(() => {
            if (Swal.isVisible()) {
              Swal.close();
            }
          }, timer);
        }
      }
    });
  }

  // API Error handler
  static handleApiError(error: any) {
    const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
    const title = error?.response?.status === 500 ? 'Server Error' : 'Error';
    
    this.error(title, message);
  }

  // Validation error handler
  static handleValidationErrors(errors: Record<string, string[]>) {
    const errorMessages = Object.values(errors).flat();
    const message = errorMessages.length > 1 
      ? errorMessages.join('\n') 
      : errorMessages[0];
    
    this.error('Validation Error', message);
  }

  // Network error handler
  static handleNetworkError() {
    this.error(
      'Network Error',
      'Unable to connect to the server. Please check your internet connection and try again.'
    );
  }

  // Success with redirect
  static successWithRedirect(title: string, message: string, redirectPath: string, timer = 2000) {
    this.success(title, message, timer);
    
    setTimeout(() => {
      window.location.href = redirectPath;
    }, timer);
  }

  // Delete confirmation
  static deleteConfirmation(itemName: string = 'item') {
    return this.confirm(
      `Delete ${itemName}?`,
      `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );
  }
}

export default SweetAlert;