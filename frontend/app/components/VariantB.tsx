export default function VariantB({ movies }: { movies: any[] }) {
    return (
      <div className="animate-fade-in">
        <div className="w-full h-[400px] bg-gradient-to-r from-red-900 to-black rounded-xl mb-8 flex items-end p-10 shadow-2xl border border-red-800">
            <div>
                <h1 className="text-5xl font-black mb-4 uppercase tracking-widest text-white drop-shadow-lg">Featured Premiere</h1>
                <button className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-300 transition">
                    ▶ Play Now
                </button>
                <p className="mt-4 text-gray-400 max-w-lg">
                    (Variant B) This simulates a heavy, high-definition video component.
                </p>
            </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-300">Trending Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div key={movie.id} className="bg-zinc-900 p-6 rounded-lg hover:scale-105 transition duration-300 border border-zinc-800">
              <h2 className="text-xl font-semibold mb-2">{movie.title}</h2>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{movie.genre}</span>
                <span className="text-green-500 font-medium">{movie.match} Match</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}