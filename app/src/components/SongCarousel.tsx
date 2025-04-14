type SongCarouselProps = {
  children: React.ReactNode;
};

function SongCarousel({ children }: SongCarouselProps) {
  return (
    <div className="p-5">
      <div className="relative overflow-x-auto w-110 flex gap-5 py-5">
        <div className="flex gap-3 pl-5 pr-5">{children}</div>
      </div>
    </div>
  );
}

export default SongCarousel;
