import RoundButton from "../components/RoundButton";

import { ref, set, DataSnapshot } from "firebase/database";
import { useState } from "react";

import defaultProfilePic from "../assets/default-profile-pic.png";

import { auth, db, storage } from "../firebase";
import {
  uploadBytes,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";

type Props = {
  userSnapshot: DataSnapshot;
};

function ProfileBanner({ userSnapshot }: Props) {
  const loggedInUser = auth.currentUser;
  const targetUser = userSnapshot.val();

  const [profilePic, setProfilePic] = useState<string>(
    targetUser?.profilePicture || defaultProfilePic
  );

  const [isFollowing, setIsFollowing] = useState(
    loggedInUser?.uid && targetUser.followers
      ? targetUser.followers[loggedInUser.uid]
      : false
  );

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

  const handleProfPicUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const userId = userSnapshot.key;
      const fileRef = storageRef(storage, `profilePictures/${userId}`);
      await uploadBytes(fileRef, file);

      const downloadUrl = await getDownloadURL(fileRef);
      await set(ref(db, `users/${userId}/profilePicture`), downloadUrl);

      setProfilePic(downloadUrl);
      alert("Profile picture uploaded successfully!");
    } catch (e: any) {
      alert(`Failed to upload profile picture: ${e.message}`);
    }
  };

  const usernameCSS = "text-3xl font-bold text-neutral";
  const subtitleCSS = "text-lg text-gray-300";
  const statusSymbolCSS = `${
    targetUser.isOnline ? "bg-green-500" : "bg-red-500"
  } absolute top-0 left-0 w-5 h-5 rounded-full border-2
     border-white transform -translate-x-1/4 -translate-y-1/4 shadow-md/25`;

  return (
    <div className="panel-card relative flex items-center gap-5">
      <div className="w-30 h-30 relative">
        <img
          src={profilePic}
          alt="Profile"
          className="w-full h-full rounded-md object-cover shadow-md/25"
        />
        {loggedInUser?.uid === userSnapshot.key && (
          <div>
            <RoundButton
              onClick={() => document.getElementById("uploadInput")?.click()}
              className="absolute top-1 right-1"
              title="Upload profile picture"
              size="x_small"
            >
              ✏️
            </RoundButton>
            <input
              id="uploadInput"
              type="file"
              accept="image/*"
              onChange={handleProfPicUpload}
              hidden
            ></input>
          </div>
        )}
        <div className={statusSymbolCSS}></div>
      </div>
      <div>
        <h1 className={usernameCSS}>{targetUser.username}</h1>
        <p className={subtitleCSS}>{targetUser.email}</p>
      </div>
      {loggedInUser?.displayName != targetUser.username && (
        <RoundButton
          size="small"
          className="absolute top-4 right-4"
          title={isFollowing ? "Unfollow" : "Follow"}
          onClick={handleBtnClick}
        >
          {isFollowing ? "–" : "+"}
        </RoundButton>
      )}
    </div>
  );
}

export default ProfileBanner;
