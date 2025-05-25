type Props = {
  message?: string;
};

const LoadingAnimation = ({ message = "Loading..." }: Props) => {
  const discColorCSS =
    "absolute inset-0 rounded-full bg-gradient-to-r from-blue-600\
     via-gray-300 to-blue-600 border-[4px] border-slate-300";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-14 h-14 animate-spin">
        <div className={discColorCSS}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
      </div>
      <p className="mt-3 text-neutral">{message}</p>
    </div>
  );
};

export default LoadingAnimation;
