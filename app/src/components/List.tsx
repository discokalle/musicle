import React from "react";

type Props = {
  children?: React.ReactNode;
};

function List({ children }: Props) {
  return (
    <>
      <ul className="list-group space-y-2">
        {React.Children.count(children) > 0 ? (
          children
        ) : (
          <li>No Item Found.</li>
        )}
      </ul>
    </>
  );
}

export default List;
