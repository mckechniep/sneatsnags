import { BuyerOffersList } from '../components/buyer/BuyerOffersList';

export const BuyerOffersPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '0'
    }}>
      <BuyerOffersList showUserOffersOnly={true} />
    </div>
  );
};