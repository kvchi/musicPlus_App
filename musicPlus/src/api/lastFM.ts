const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function fetchTopArtist() {
  const res = await fetch(
    `${BASE_URL}?method=chart.gettopartists&api_key=${API_KEY}&format=json`
  );
  const data = await res.json();
  console.log(data);
  return data.artists?.artist;
}

export async function fetchTopTracks() {
  const res = await fetch(
    `${BASE_URL}?method=chart.gettoptracks&api_key=${API_KEY}&format=json`
  );
  const data = await res.json();
  return data.tracks.track;
}

export async function fetchTopTags() {
  const res = await fetch(
    `${BASE_URL}?method=chart.gettoptags&api_key=${API_KEY}&format=json`
  );
  const data = await res.json();
  return data.tags.tag;
}

export async function fetchArtistTopAlbums(artist: string) {
  const res = await fetch(
    `${BASE_URL}?method=artist.getTopAlbums&artist=${encodeURIComponent(
      artist
    )}&api_key=${API_KEY}&format=json`
  );

  const data = await res.json();

  return data?.topalbums?.album ?? [];
}

