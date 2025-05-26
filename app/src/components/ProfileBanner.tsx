import RoundButton from "../components/RoundButton";

import {
  uploadBytes,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import { ref, set, DataSnapshot } from "firebase/database";
import { useState } from "react";
import clsx from "clsx";

import defaultProfilePic from "../assets/default-profile-pic.png";

import { auth, db, storage } from "../firebase";

import { panelCardCSS, ySeparatorCSS } from "../styles";

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

  const queueStats = userSnapshot.val()?.gameStats?.queue;
  const queueKeyToName: Record<string, string> = {
    numEnqueuedTracks: "Tracks Enqueued",
    numHostedSessions: "Sessions Hosted",
    numParticipatedSessions: "Sessions Participated",
    numVotes: "Tracks Voted",
  };

  const quizStats = userSnapshot.val()?.gameStats?.quiz;
  const quizKeyToName: Record<string, string> = {
    numParticipatedQuizzes: "Quizzes Played",
    numHostedQuizzes: "Quizzes Hosted",
    numWonQuizzes: "Quizzes Won",
    numAccuracy: "Answer Accuracy",
  };

  const usernameCSS = "text-3xl font-bold text-neutral";
  const subtitleCSS = "text-lg text-gray-300";
  const statusSymbolCSS = `${
    targetUser.isOnline ? "bg-green-500" : "bg-red-500"
  } absolute top-0 left-0 w-5 h-5 rounded-full border-2
     border-white transform -translate-x-1/4 -translate-y-1/4 shadow-md/25`;

  return (
    <div
      className={clsx(
        panelCardCSS,
        "relative flex items-center justify-between gap-5 pr-10"
      )}
    >
      <div className="flex flex-row gap-5 items-center">
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
      </div>
      <div className="flex flex-row gap-5">
        <div>
          <h3 className="text-md font-semibold text-neutral mb-1">
            Quiz Stats
          </h3>
          {quizStats ? (
            <div className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-1 text-sm">
              {Object.entries(quizStats)
                .filter(
                  ([key]) =>
                    key !== "numCorrectAnswers" && key !== "numTotalAnswers"
                )
                .map(([key, value]) => (
                  <>
                    <span className="text-gray-400">
                      {quizKeyToName[key] ?? key}:
                    </span>
                    <span className="text-neutral font-medium text-right">
                      {String(value)}
                    </span>
                  </>
                ))}
            </div>
          ) : (
            <div>No stats to show.</div>
          )}
        </div>
        <div className={ySeparatorCSS}></div>
        {/* class below accounts for follow/unfollow button on other users' pages */}
        <div className={loggedInUser?.uid !== userSnapshot.key ? "mr-8" : ""}>
          <h3 className="text-md font-semibold text-neutral mb-1">
            Queue Stats
          </h3>
          {queueStats ? (
            <div className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-1 text-sm">
              {Object.entries(queueStats).map(([key, value]) => (
                <>
                  <span className="text-gray-400">
                    {queueKeyToName[key] ?? key}:
                  </span>
                  <span className="text-neutral font-medium text-right">
                    {String(value)}
                  </span>
                </>
              ))}
            </div>
          ) : (
            <div>No stats to show.</div>
          )}
        </div>
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
