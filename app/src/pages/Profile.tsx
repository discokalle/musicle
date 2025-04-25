// import { useOutletContext } from "react-router";
import { DataSnapshot } from "firebase/database";

type ProfileContext = { userSnapshot: DataSnapshot };

function Profile() {
  // const { userSnapshot } = useOutletContext<ProfileContext>();

  return (
    <div className="flex flex-col gap-5 panel-card p-4">
      <h2 className="text-xl font-semibold border-b border-gray-600 pb-2">
        Overview
      </h2>
      <p>This is the main profile overview section.</p>
    </div>
  );
}

export default Profile;
