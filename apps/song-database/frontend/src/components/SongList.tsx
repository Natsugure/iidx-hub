import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Song } from '../api/client';

export const SongList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const data = await api.getSongs();
        setSongs(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch songs. Make sure the backend is running.');
        console.error('Error fetching songs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading songs...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }

  if (songs.length === 0) {
    return <div style={{ padding: '20px' }}>No songs found.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>IIDX Song Database</h1>
      <p>Total songs: {songs.length}</p>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {songs.map((song) => (
          <div
            key={song.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0' }}>{song.title}</h2>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Artist:</strong> {song.artist}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Genre:</strong> {song.genre}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>BPM:</strong> {song.bpm}
            </p>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Version:</strong> {song.version}
            </p>
            
            <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Charts:</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {song.charts.map((chart) => (
                <div
                  key={chart.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <div>
                    <strong>{chart.playStyle}</strong> {chart.difficulty}
                  </div>
                  <div>
                    Level: {chart.level}
                    {chart.unofficialLevel && ` (${chart.unofficialLevel})`}
                  </div>
                  {chart.notes && <div>Notes: {chart.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};