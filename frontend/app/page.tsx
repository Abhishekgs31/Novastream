'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VariantA = dynamic(() => import('./components/VariantA'), { ssr: false });
const VariantB = dynamic(() => import('./components/VariantB'), { ssr: false });

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New AI State
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      let userId = localStorage.getItem('nova_user_id');
      if (!userId) {
          userId = 'user_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('nova_user_id', userId);
      }
      
      const userAgent = window.navigator.userAgent;
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const deviceFingerprint = btoa(`${userAgent}-${screenRes}`).substring(0, 32);

      try {
          const authRes = await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, fingerprint: deviceFingerprint })
          });
          const authData = await authRes.json();
          const token = authData.token;
          localStorage.setItem('nova_token', token);
          localStorage.setItem('nova_fingerprint', deviceFingerprint);

          const abResponse = await fetch(`http://localhost:5000/api/ab-test?userId=${userId}`);
          const abData = await abResponse.json();
          setVariant(abData.variant);

          const movieResponse = await fetch('http://localhost:5000/api/movies', {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'x-device-fingerprint': deviceFingerprint
              }
          });

          if (!movieResponse.ok) throw new Error("Security Block: " + await movieResponse.text());

          const movieData = await movieResponse.json();
          setMovies(movieData);

      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // --- PHASE 4: The AI Trigger ---
  const triggerAI = async (device: string, hoverMs: number) => {
    try {
        const token = localStorage.getItem('nova_token');
        const fingerprint = localStorage.getItem('nova_fingerprint');
        const userId = localStorage.getItem('nova_user_id');

        const aiRes = await fetch('http://localhost:5000/api/ai-recommendations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-device-fingerprint': fingerprint as string,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                deviceType: device,
                timeOfDay: "Evening",
                hoverTimeMs: hoverMs
            })
        });

        const aiData = await aiRes.json();
        setAiStrategy(aiData.bandit_strategy);
        setAiRecs(aiData.recommendations);
    } catch (err) {
        console.error("AI Fetch Error", err);
    }
  };

  if (error) return <div className="p-10 text-red-500 bg-black min-h-screen">Security Error: {error}</div>;
  if (loading || !variant) return <div className="p-10 text-white bg-black min-h-screen flex items-center justify-center">Authenticating & Routing Traffic...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-10 font-sans">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-4xl font-bold text-red-600">NovaStream</h1>
        
        {/* Developer Dashboard to trigger AI context */}
        <div className="flex gap-4">
            <button onClick={() => triggerAI('Desktop', 3000)} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm text-blue-400 font-mono border border-zinc-700 transition">
                Simulate: Desktop (Hover &gt; 2s)
            </button>
            <button onClick={() => triggerAI('Mobile', 500)} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm text-green-400 font-mono border border-zinc-700 transition">
                Simulate: Mobile Device
            </button>
        </div>
      </div>

      {/* AI Recommendation Section (Only shows when AI is triggered) */}
      {aiRecs.length > 0 && (
          <div className="mb-12 p-6 bg-gradient-to-r from-zinc-900 to-black border border-purple-900/50 rounded-xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  ✨ AI Personalized For You 
              </h2>
              <p className="text-purple-400 font-mono text-sm mb-4">Contextual Bandit Strategy: {aiStrategy}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {aiRecs.map((movie) => (
                    <div key={movie.id} className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 shadow-inner">
                    <h2 className="text-xl font-semibold mb-2">{movie.title}</h2>
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>{movie.genre}</span>
                        <span className="text-green-500 font-medium">{movie.match} Match</span>
                    </div>
                    </div>
                ))}
              </div>
          </div>
      )}
      
      {variant === 'A' ? <VariantA movies={movies} /> : <VariantB movies={movies} />}
    </main>
  );
}