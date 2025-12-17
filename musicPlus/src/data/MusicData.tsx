import { cover } from "@/assets/images";
import { balance, fiesta, higherLife, lose, luv, stutter } from "@/assets/music";

export interface Track {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover: string;
}

export const playlist: Track[] = [
  {
    id: 1,
    title: "Luv",
    artist: "Tory Lanez",
    src: luv,
    cover,
  },
  {
    id: 2,
    title: "Lose",
    artist: "Wizkid",
    src: lose,
    cover,
  },
  {
    id: 3,
    title: "Balnce",
    artist: "Wizkid",
    src: balance,
    cover,
  },
  {
    id: 4,
    title: "Stutter",
    artist: "Chris Brown",
    src: stutter,
    cover,
  },
  {
    id: 4,
    title: "Fiesta",
    artist: "Dj Maphorisa, Dj Tunez, Wizkid, Zaba, Zeh McGeba",
    src: fiesta,
    cover,
  },
  {
    id: 6,
    title: "Higer Life",
    artist: "Kranium ft Chronic Law",
    src: higherLife,
    cover,
  },
];
