import StreamsList from "../components/StreamsList";
import ProfileBanner from "../components/ProfileBanner";

import { auth } from "../firebase";

function Profile() {
  const containerCSS =
    "text-neutral absolute flex flex-col left-1/2 top-1/2 transform\
    -translate-x-1/2 -translate-y-1/2 gap-5";

  const user = auth.currentUser;

  if (user == null) {
    return <div>Cannot load user data.</div>;
  }

  return (
    <div className={containerCSS}>
      <ProfileBanner user={user}></ProfileBanner>
      <div className="flex flex-row gap-5 items-start">
        <div className="flex flex-col gap-3">
          <h1 className="text-neutral text-2xl font-bold">Recent Streams</h1>
          <StreamsList></StreamsList>
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-3xl font-bold">(top artist here)</p>
          <p className="text-3xl font-bold">(top genre here)</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
