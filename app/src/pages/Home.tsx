import SongCard from "../components/SongCard";
import SongCarousel from "../components/SongCarousel";
import markoolioCover from "../assets/markoolio.jpg";
import tealCover from "../assets/teal.jpg";
import gxtorCover from "../assets/gxtor.jpg";

function Home() {
  const centerContainerCSS =
    "absolute flex flex-col items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  const titleCSS =
    "text-3xl text-white text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>Kalles Senaste</h1>
      <SongCarousel>
        <SongCard title="Bara Femmor" artist="Gxtsh" cover={gxtorCover} />
        <SongCard
          title="Vi drar till fjällen"
          artist="Markoolio"
          cover={markoolioCover}
        />
        <SongCard title="Africa" artist="Weezer" cover={tealCover} />
        <SongCard title="Bara Femmor" artist="Gxtsh" cover={gxtorCover} />
      </SongCarousel>
    </div>
  );
}

export default Home;
