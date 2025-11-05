import React from "react";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";
const Dashboard: React.FC = () => {
  interface Track {
    id: string;
    name: string;
    artist_name: string;
    album: string;
    duration: number;
  }
  const BASE_URL = import.meta.env.VITE_JAMENDO_API_URL;
  const CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID;

  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<Track[]>([]);

  const onSearch = async () => {
    const query = encodeURIComponent(search);
    try {
      const response = await fetch(
        `${BASE_URL}/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=10&search=${query}`
      );
      const data = await response.json();
      console.log("Searchresults:", data);
      console.log(data.results);
      setResults(data.results);
    } catch (error) {
      console.error("Error fetching tracks", error);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <SignOutButton />
      <SignedIn>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for tracks"
      />
      </SignedIn>
      <SignedOut>
        <p>Please sign in to access the dashboard.</p>
      </SignedOut>
      <button onClick={() => onSearch()}>Search</button>
      <div>
        <div>
          {results.map((track) => (
            <div key={track.id}>
              {track.name} - {track.artist_name}-{track.album} -{" "}
              {track.duration}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
