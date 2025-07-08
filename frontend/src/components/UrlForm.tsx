import { useState } from "react";
import axios from "axios";

const UrlForm = ()=> {
    const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/urls', {
        Url: url,
      });
      console.log('Response:', response.data);
      setSuccess(`URL submitted successfully.`);
      setUrl('');
    } catch (err: any) {
      setError('Failed to submit URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to crawl"
        required
        style={{ padding: '10px', width: '300px', marginRight: '10px' }}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );

}
export default UrlForm;
