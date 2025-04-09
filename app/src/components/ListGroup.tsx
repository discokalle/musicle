import { useState } from "react";

function ListGroup() {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const heading: string = "List";
  const items: string[] = ["Gor", "Kalle", "Lukas", "Johan"];

  return (
    <>
      <h1 className="text-neutral">{heading}</h1>
      {items.length === 0 && <p>No item found</p>}
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            className={`list-group-item text-neutral${
              selectedIdx === index ? "active" : ""
            }`}
            key={item}
            onClick={() => {
              setSelectedIdx(index);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export default ListGroup;
