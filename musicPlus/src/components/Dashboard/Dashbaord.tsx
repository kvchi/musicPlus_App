import React from "react";
import { SignedIn, SignedOut, } from "@clerk/clerk-react";
import TopArtists from "../Card/TopArtists";
import TopTracks from "../Card/TopTracks";
import TopTags from "../Card/TopTags";

const Dashboard: React.FC = () => {
  

  return (
    <>
      <div className="bg-black/40 px-4">

      <TopArtists />
      <TopTracks />
      <TopTags />
      <SignedIn>
      
      </SignedIn>
      <SignedOut>
        <p>Please sign in to access the dashboard.</p>
      </SignedOut>
    </div>
    </>
  );
};

export default Dashboard;
