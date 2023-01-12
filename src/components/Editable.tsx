import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

// https://github.com/learnwithparam/logrocket-inline-edit-ui
const Editable = ({
  text,
  type,
  placeholder,
  children,
  childRef,
  onChangeStart,
  onChangeComplete,
  editing,
}: {
  text: string;
  type: string;
  placeholder: string;
  children: React.ReactNode;
  childRef: any;
  onChangeStart: any;
  onChangeComplete: any;
  editing: boolean;
}) => {
  const [isEditing] = useState(editing);

  useEffect(() => {
    if (childRef && childRef.current && isEditing === true) {
      childRef.current.focus();
    }
  }, [isEditing, childRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, type: string) => {
    const { key } = event;
    const keys = ["Escape", "Tab"];
    const enterKey = "Enter";
    const allKeys = [...keys, enterKey];
    if (
      (type === "textarea" && keys.indexOf(key) > -1) ||
      (type !== "textarea" && allKeys.indexOf(key) > -1)
    ) {
      event.preventDefault();
      endEditing();
    }
  };

  function startEditing() {
    // setEditing(true);
    onChangeStart();
  }

  function endEditing() {
    // setEditing(false);
    // console.log("end editing");
    onChangeComplete();
  }

  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    onChangeComplete();
  });

  return (
    <>
      {isEditing ? (
        <div
          ref={ref}
          onBlur={() => {
            endEditing();
          }}
          onKeyDown={(e) => handleKeyDown(e, type)}
        >
          {children}
        </div>
      ) : (
        <div
          className={`hover:shadow-outline truncate whitespace-nowrap rounded py-2 px-3 leading-tight text-gray-700 editable-${type}`}
          onClick={() => startEditing()}
        >
          <span className={`${text ? "text-black" : "text-gray-500"}`}>
            {text || placeholder || "Editable content"}
          </span>
        </div>
      )}
    </>
  );
};

export default Editable;
