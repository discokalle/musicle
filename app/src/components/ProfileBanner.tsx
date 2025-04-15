import defaultProfilePic from "../assets/default-profile-pic.png";
import RoundButton from "../components/RoundButton";

import { auth } from "../firebase";

type Props = {
  user: any;
};

function Profile({ user }: Props) {
  const bannerCSS =
    "relative flex items-center gap-5 bg-secondary rounded-md\
     object-cover px-4 py-3 shadow-md/25";
  const usernameCSS = "text-3xl font-bold text-neutral";
  const subtitleCSS = "text-lg text-gray-300";
  const statusSymbolCSS =
    "absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2\
     border-white transform translate-x-1/3 -translate-y-1/3 shadow-md/25";

  return (
    // profile picture, username and description will be loaded dynamically eventually...
    <div className={bannerCSS}>
      <div className="relative">
        <img
          src={user.profilePicture || defaultProfilePic}
          alt="Profile"
          className="w-30 h-30 rounded-md object-cover shadow-md/25"
        />
        <div className={statusSymbolCSS}></div>
      </div>
      <div>
        <h1 className={usernameCSS}>{user.username}</h1>
        <p className={subtitleCSS}>{user.email}</p>
      </div>
      <div className="absolute top-4 right-4">
        {auth.currentUser?.displayName != user.username && (
          <RoundButton size="small">+</RoundButton>
        )}
      </div>
    </div>
  );
}

export default Profile;
