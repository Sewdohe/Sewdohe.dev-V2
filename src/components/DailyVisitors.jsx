import { useEffect, useState } from 'react';

export default function DailyVisitors() {
  const [visitors, setVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-visitors')
      .then((res) => res.json())
      .then((data) => setVisitors(data.visitors ?? 0))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading visitors...</div>;

  return (
    <div>
      <strong>{visitors.toLocaleString()}</strong> visitors today
    </div>
  );
}