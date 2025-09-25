import { TransactionHistory } from '../components/shared/TransactionHistory';

export const SellerTransactionsPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7F7F7 0%, #FFFFFF 100%)',
      padding: '32px 20px'
    }}>
      <TransactionHistory userType="seller" />
    </div>
  );
};