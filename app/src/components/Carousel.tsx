type Props = {
  children: React.ReactNode;
  className: string;
};

function Carousel({ children, className }: Props) {
  return (
    <div
      className={`${className} relative overflow-x-auto w-200 flex gap-5 overflow-y-hidden pb-3`}
    >
      <div className="flex gap-3 pl-5 pr-5">{children}</div>
    </div>
  );
}

export default Carousel;
