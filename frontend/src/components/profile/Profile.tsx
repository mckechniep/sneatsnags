import { useAuth } from '../../hooks/useAuth';
import { BuyerProfile } from './BuyerProfile';
import { SellerProfile } from './SellerProfile';
import { AdminProfile } from './AdminProfile';
import { UserRole } from '../../types/auth';

export const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  // Render the appropriate profile component based on user role
  switch (user.role) {
    case UserRole.BUYER:
      return <BuyerProfile />;
    case UserRole.SELLER:
      return <SellerProfile />;
    case UserRole.ADMIN:
      return <AdminProfile />;
    default:
      return <BuyerProfile />; // Default to buyer profile
  }
};