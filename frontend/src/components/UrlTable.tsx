import  { useEffect, useState } from 'react';
import axios from 'axios';

interface UrlItem {
  ID: number;
  Url: string;
  Title: string;
  Status: string;
  InternalLinks: number;
  ExternalLinks: number;
  BrokenLinks: number;
}

const truncateUrl = (url: string, maxLength = 60) => {
  return url.length > maxLength ? url.slice(0, maxLength) + '...' : url;
};

const UrlTable = () => {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const response = await axios.get('http://localhost:8080/urls');
        setUrls(response.data);
      } catch (err) {
        setError('Failed to load URLs.');
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, []);

  if (loading) return <p>Loading URLs...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <table border={1} cellPadding={6} style={{ width: '100%' }}>
      <thead>
        <tr>
          <th>Title</th>
          <th>URL</th>
          <th>Status</th>
          <th>Internal</th>
          <th>External</th>
          <th>Broken</th>
        </tr>
      </thead>
      <tbody>
        {urls.map((url) => (
          <tr key={url.ID}>
            <td>{url.Title || '—'}</td>
            <td title={url.Url}>{truncateUrl(url.Url)}</td>
            <td>{url.Status}</td>
            <td>{url.InternalLinks ?? '-'}</td>
            <td>{url.ExternalLinks ?? '-'}</td>
            <td>{url.BrokenLinks ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UrlTable;
