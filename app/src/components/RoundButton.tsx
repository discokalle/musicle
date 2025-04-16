type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
};

function RoundButton({ children, className, onClick, size = "medium" }: Props) {
  const sizeClasses = {
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
    <button className={CSS} onClick={onClick}>
      {children}
    </button>
  );
}

export default RoundButton;
