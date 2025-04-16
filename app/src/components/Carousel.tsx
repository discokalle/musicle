type Props = {
  children: React.ReactNode;
};

function Carousel({ children }: Props) {
  return (
    <div className="p-5">
      <div className="relative overflow-x-auto w-200 flex gap-5 py-5">
        <div className="flex gap-3 pl-5 pr-5">{children}</div>
      </div>
    </div>
  );
}

export default Carousel;
