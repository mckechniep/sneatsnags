import { BuyerOffersList } from '../components/buyer/BuyerOffersList';

export const BuyerOffersPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 100%)',
      padding: '0'
    }}>
      <BuyerOffersList showUserOffersOnly={true} />
    </div>
  );
};