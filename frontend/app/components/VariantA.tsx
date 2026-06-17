export default function VariantA({ movies }: { movies: any[] }) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 text-gray-300">Continue Watching (Variant A)</h2>
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