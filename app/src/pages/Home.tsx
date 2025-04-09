function Home() {
  const centerContainerCSS: string =
    "absolute flex flex-col gap-5 items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";

  const titleCSS: string =
    "text-3xl text-neutral text-center transition-transform duration-200 ease-in-out hover:scale-110";

  return (
    <div className={centerContainerCSS}>
      <h1 className={titleCSS}>THIS IS THE HOME PAGE</h1>
    </div>
  );
}

export default Home;
