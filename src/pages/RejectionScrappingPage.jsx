import { useNavigate } from 'react-router-dom';
import RejectionScrappingCard from '../components/rejection-scrapping/RejectionScrappingCard';

export default function RejectionScrappingPage({ backRoute, ieUserId, ieType }) {
  const navigate = useNavigate();
  return (
    <RejectionScrappingCard
      ieUserId={ieUserId}
      ieType={ieType}
      onBack={() => navigate(backRoute)}
    />
  );
}
