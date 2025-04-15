import RoundButton from "../components/RoundButton";

import { ref, get, set, DataSnapshot } from "firebase/database";
import { useEffect, useState } from "react";

import defaultProfilePic from "../assets/default-profile-pic.png";

import { auth, db } from "../firebase";

type Props = {
  userSnapshot: DataSnapshot;
};

function ProfileBanner({ userSnapshot }: Props) {
  const bannerCSS =
    "relative flex items-center gap-5 bg-secondary rounded-md\
     object-cover px-4 py-3 shadow-md/25";
  const usernameCSS = "text-3xl font-bold text-neutral";
  const subtitleCSS = "text-lg text-gray-300";
  // const statusSymbolCSS =
  //   "absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2\
  //    border-white transform translate-x-1/3 -translate-y-1/3 shadow-md/25";

  const loggedInUser = auth.currentUser;
  const targetUser = userSnapshot.val();

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const loggedInUserId = loggedInUser?.uid;
        const targetUserId = userSnapshot.key;

        const followingRef = ref(
          db,
          `users/${loggedInUserId}/following/${targetUserId}`
        );
        const followingSnapshot = await get(followingRef);

        setIsFollowing(followingSnapshot.exists());
      } catch (e: any) {
        console.error("Error:", e.message);
      }
    };

    checkFollowStatus();
  }, [loggedInUser, userSnapshot]);

  const handleBtnClick = async () => {
    try {
      // it can be assumed that both users exist
      const loggedInUserId = loggedInUser?.uid;
      const targetUserId = userSnapshot.key;

      const followingRef = ref(
        db,
        `users/${loggedInUserId}/following/${targetUserId}`
      );
      const followersRef = ref(
        db,
        `users/${targetUserId}/followers/${loggedInUserId}`
      );

      if (!isFollowing) {
        await set(followingRef, true);
        await set(followersRef, true);
        setIsFollowing(true);
      } else {
        await set(followingRef, null);
        await set(followersRef, null);
        setIsFollowing(false);
      }
    } catch (e: any) {
      alert(`Error ${e.message}`);
    }
  };

  return (
    // profile picture, username and description will be loaded dynamically eventually...
    <div className={bannerCSS}>
      <div className="relative">
        <img
          src={targetUser.profilePicture || defaultProfilePic}
          alt="Profile"
          className="w-30 h-30 rounded-md object-cover shadow-md/25"
        />
        {/* Reintroduce the status symbol later if we implement it: */}
        {/* <div className={statusSymbolCSS}></div> */}
      </div>
      <div>
        <h1 className={usernameCSS}>{targetUser.username}</h1>
        <p className={subtitleCSS}>{targetUser.email}</p>
      </div>
      {loggedInUser?.displayName != targetUser.username && (
        <RoundButton
          size="small"
          className="absolute top-4 right-4"
          onClick={handleBtnClick}
        >
          {isFollowing ? "–" : "+"}
        </RoundButton>
      )}
    </div>
  );
}

export default ProfileBanner;
