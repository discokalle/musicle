import StreamsList from "../components/StreamsList";
import ProfileBanner from "../components/ProfileBanner";

function Profile() {
  const containerCSS =
    "text-neutral absolute flex flex-col left-1/2 top-1/2 transform\
    -translate-x-1/2 -translate-y-1/2 gap-5";

  return (
    <div className={containerCSS}>
      <ProfileBanner></ProfileBanner>
      <div className="flex flex-row gap-5 items-start">
        <div className="flex flex-col gap-3">
          <h1 className="text-neutral text-2xl font-bold">Recent Streams</h1>
          <StreamsList></StreamsList>
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-3xl font-bold">Top Artist here</p>
          <p className="text-3xl font-bold">Top Genre here</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
