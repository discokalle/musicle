type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  size?: "x_small" | "small" | "medium" | "large";
};

function RoundButton({
  children,
  className,
  title,
  onClick,
  size = "medium",
}: Props) {
  const sizeClasses = {
    x_small: { wh: "w-4 h-4", text: "text-sm" },
    small: { wh: "w-8 h-8", text: "text-md" },
    medium: { wh: "w-12 h-12", text: "text-lg" },
    large: { wh: "w-16 h-16", text: "text-2xl" },
  };

  const sizeClass = sizeClasses[size];

  const CSS = `${className} ${sizeClass.text} ${sizeClass.wh} 
                flex items-center justify-center
                rounded-full p-3 shadow-md/75 bg-neutral font-bold
                text-secondary hover:text-accent hover:hover:shadow-sm/100
                transition-all duration-250 ease-in-out cursor-pointer`;

  return (
    <button title={title} className={CSS} onClick={onClick}>
      {children}
    </button>
  );
}

export default RoundButton;
