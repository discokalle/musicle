import gorProfilePic from "../assets/gor-profile-picture.jpeg";

import ListGroup from "../components/ListGroup";

function Profile() {
  const containerCSS =
    "absolute flex flex-col left-1/2 top-1/2 transform\
    -translate-x-1/2 -translate-y-1/2 gap-5";
  const bannerCSS: string =
    "relative flex items-center gap-5 bg-secondary rounded-md\
     object-cover px-4 py-3 shadow-md/25";
  const usernameCSS: string = "text-3xl font-bold text-neutral";
  const subtitleCSS: string = "text-lg text-gray-300";
  const statusSymbolCSS: string =
    "absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2\
     border-white transform translate-x-1/3 -translate-y-1/3 shadow-sm/25";

  return (
    // profile picture, username and description will be loaded dynamically eventually...
    <div className={containerCSS}>
      <div className={bannerCSS}>
        <div className="relative">
          {/* profile picture and status container */}
          <img
            src={gorProfilePic}
            alt="Profile"
            className="w-30 h-30 rounded-md object-cover shadow-md/25"
          />
          <div className={statusSymbolCSS}></div>
        </div>
        <div>
          <h1 className={usernameCSS}>Gordu962</h1>
          <p className={subtitleCSS}>CHOP SUEY!</p>
        </div>
      </div>
      <ListGroup></ListGroup>
    </div>
  );
}

export default Profile;
