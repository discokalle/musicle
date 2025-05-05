import Button from "../components/Button";

function Queue() {
  const centerContainerCSS =
    "absolute flex flex-col gap-7 items-center left-1/2 top-[40%] transform -translate-x-1/2";

  const titleCSS =
    "text-5xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>
        This is{" "}
        <span className="italic text-accent font-bold">THE LIVE QUEUE!</span>
      </h1>
      <p className="text-neutral text-xl">
        Gather your friends and queue songs in a joint Spotify session in
        real-time!
      </p>

      <div className="flex gap-10">
        <Button>Create Queue</Button>
        <Button>Join Queue</Button>
      </div>
    </div>
  );
}

export default Queue;
