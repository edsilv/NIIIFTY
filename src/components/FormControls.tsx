/* eslint-disable react/button-has-type */
import React, { useRef, ChangeEvent } from "react";
import { FormikErrors } from "formik";
const ReactQuill =
  typeof window === "object" ? require("react-quill") : () => false;
import "react-quill/dist/quill.snow.css";
import ReactSelect, { ValueType } from "react-select";
// @ts-ignore
import classNames from "classnames";

interface Option {
  label: string;
  value: string;
}

export const Select = ({
  name,
  form,
  options,
  isMulti,
  closeMenuOnSelect,
  menuPlacement = "bottom",
  styles,
  isDisabled,
}: {
  name: string;
  form: any;
  options: Option[];
  isMulti?: boolean;
  closeMenuOnSelect?: false;
  menuPlacement?: "top" | "bottom" | "auto";
  styles?: any;
  isDisabled?: boolean;
}) => {
  const onChange = (option: ValueType<Option | Option[]>) => {
    form.setFieldValue(
      name,
      isMulti
        ? ((option as Option[]) || []).map((item: Option) => item.value)
        : (option as Option).value
    );
  };

  const getValue = () => {
    if (options) {
      return isMulti
        ? options.filter(
            (option) => form.values[name].indexOf(option.value) >= 0
          )
        : options.find(
            (option) =>
              option.value ===
              (Array.isArray(form.values[name])
                ? form.values[name][0]
                : form.values[name])
          );
    } else {
      return isMulti ? [] : ("" as any);
    }
  };

  return (
    <ReactSelect
      name={name}
      isMulti={isMulti}
      closeMenuOnSelect={closeMenuOnSelect}
      value={getValue()}
      options={options}
      onChange={onChange}
      menuPlacement={menuPlacement}
      className="basic-multi-select"
      classNamePrefix="select"
      styles={styles}
      isDisabled={isDisabled}
      theme={(theme) => ({
        ...theme,
        borderRadius: 0,
      })}
    />
  );
};

export const Button = ({
  disabled = false,
  text,
  label,
  type = "button",
  onClick = () => {
    return false;
  },
  onMouseUp = () => {
    return false;
  },
  classes,
}: {
  disabled?: boolean;
  text: string;
  label?: string;
  type?: "submit" | "button";
  onClick?: (event: any) => void;
  onMouseUp?: (event: any) => void;
  classes?: string | undefined;
}) => {
  const c = classNames(
    classes,
    "transition duration-300 bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring",
    {
      "opacity-25": disabled,
    }
  );
  return (
    <button
      aria-label={label || text}
      disabled={disabled}
      className={c}
      type={type}
      onClick={onClick}
      onMouseUp={onMouseUp}
    >
      {text}
    </button>
  );
};

export const FormItem = ({
  classes,
  children,
}: {
  classes?: string | undefined;
  children?: any;
}) => {
  const c = classNames(classes, "mb-8");
  return <div className={c}>{children}</div>;
};

export const Label = ({
  value,
  htmlFor,
  optional,
  classes,
}: {
  value: string;
  htmlFor?: string;
  optional?: boolean;
  classes?: string | undefined;
}) => {
  const c = classNames(
    classes,
    "block text-gray-900 dark:text-white text-sm font-bold mb-2"
  );
  const label = `${value} ${!optional && "(required)"}`;
  return (
    <label
      title={label}
      aria-label={label}
      className={c}
      htmlFor={htmlFor || value.toLowerCase()}
    >
      {value}{" "}
      {optional && (
        <span className="font-normal text-gray-700">(optional)</span>
      )}
    </label>
  );
};

export const LinkButton = ({
  disabled = false,
  text,
  label,
  type = "button",
  onClick = () => {
    return false;
  },
  classes,
}: {
  disabled?: boolean;
  text: string;
  label?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  classes?: string | undefined;
}) => {
  const c = classNames(
    classes,
    "text-primary-600 bg-transparent font-bold py-2 px-0 focus:outline-none",
    {
      "opacity-25": disabled,
    }
  );
  return (
    <button
      aria-label={label || text}
      disabled={disabled}
      className={c}
      type={type}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export const SVGButton = ({
  children,
  label,
  disabled = false,
  off = false,
  type = "button",
  onClick = () => {
    return false;
  },
  classes,
}: {
  children: any;
  label: string;
  disabled?: boolean;
  off?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  classes?: string | undefined;
}) => {
  const c = classNames(classes, {
    "opacity-25": disabled || off,
  });
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={c}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const SVGLinkButton = ({
  children,
  label,
  disabled = false,
  type = "button",
  primary,
  minimizeDisabled = false,
  onClick = () => {
    return false;
  },
  classes,
}: {
  children: any;
  label: string;
  disabled?: boolean;
  type?: "submit" | "button";
  primary?: boolean;
  minimizeDisabled?: boolean;
  onClick?: () => void;
  classes?: string | undefined;
}) => {
  const c = classNames(
    classes,
    "transition duration-300 font-bold py-2 px-0 focus:outline-none inline-flex items-center",
    {
      "opacity-25": disabled,
      "text-primary-600 bg-transparent": !primary,
      "md:bg-primary-500 md:hover:bg-primary-700 text-white md:px-4 md:rounded md:focus:ring":
        primary && !minimizeDisabled,
      "bg-primary-500 hover:bg-primary-700 text-white px-4 rounded focus:ring":
        primary && minimizeDisabled,
    }
  );
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={c}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const SVGLinkButtonText = ({
  text,
  minimizeDisabled = false,
  classes,
}: {
  text: string;
  minimizeDisabled?: boolean;
  classes?: string | undefined;
}) => {
  // must use .hide not .hidden, otherwise the UV's .hidden class hides the links when it loads
  const c = classNames(classes, {
    "mt-0.5": true,
    "hide md:block": !minimizeDisabled,
  });

  return (
    <span
      className={c}
      style={{
        marginTop: "0.125rem",
      }}
    >
      {text}
    </span>
  );
};

type OnChange = (
  eventOrPath: string | ChangeEvent<any>
) => void | ((eventOrTextValue: string | ChangeEvent<any>) => void);
type Errors = FormikErrors<any> | { [key: string]: string | boolean };

const hasError = (id: string, errors: Errors | undefined) => {
  return errors !== undefined && Object.keys(errors).includes(id);
};

export const TextArea = ({
  id,
  value,
  onChange,
  errors,
  classes,
}: {
  id: string;
  value: string;
  onChange: OnChange;
  errors?: Errors | undefined;
  classes?: string | undefined;
}) => {
  const err: boolean = hasError(id, errors);
  const c = classNames(
    classes,
    "shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring",
    {
      "border-red-500": err,
    }
  );
  return (
    <>
      <textarea
        key={id}
        className={c}
        id={id}
        name={id}
        onChange={onChange}
        value={value}
      />
      {err && <ValidationMessage message={(errors as any)[id]} />}
    </>
  );
};

export const TextInput = ({
  classes,
  errors,
  id,
  maxLength,
  onChange,
  placeholder,
  readonly = false,
  type = "text",
  value,
}: {
  classes?: string | undefined;
  errors?: Errors | undefined;
  id: string;
  maxLength?: number;
  onChange?: OnChange;
  placeholder?: string;
  readonly?: boolean;
  type?: "text" | "password";
  value: string | undefined;
}) => {
  const err: boolean = hasError(id, errors);
  const c = classNames(
    classes,
    "shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring",
    {
      "border-gray-300": !err,
      "border-red-500": err,
    }
  );
  return (
    <>
      <input
        key={id}
        className={c}
        id={id}
        maxLength={maxLength}
        placeholder={placeholder}
        name={id}
        type={type}
        onChange={onChange}
        value={value}
        readOnly={readonly}
        autoComplete="on"
      />
      {err && <ValidationMessage message={(errors as any)[id]} />}
    </>
  );
};

export const HiddenField = ({
  id,
  value,
}: {
  id: string;
  value: string | undefined;
}) => {
  return (
    <input key={id} id={id} name={id} type="hidden" value={value} readOnly />
  );
};

export const Checkbox = ({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: OnChange;
}) => {
  return (
    <>
      <input
        type="checkbox"
        disabled={disabled}
        id={id}
        checked={checked}
        className="mr-2 h-5 w-5 align-middle"
        onChange={onChange}
      />
      <label htmlFor={id} className="align-middle text-sm">
        {label}
      </label>
    </>
  );
};

export const CheckboxButton = ({
  id,
  label,
  checked,
  onChange,
  primary,
  disabled,
  classes,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange?: OnChange;
  primary?: boolean;
  disabled?: boolean;
  classes?: string | undefined;
}) => {
  const c = classNames(
    classes,
    "transition duration-300 font-bold py-2 px-0 focus:outline-none inline-flex items-center cursor-pointer",
    {
      "opacity-25": disabled,
      "text-primary-600 bg-transparent": !primary,
    }
  );
  return (
    <div className={c}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        className="mr-2 h-5 w-5 cursor-pointer align-middle"
        onChange={onChange}
      />
      <label
        htmlFor={id}
        className="cursor-pointer select-none align-middle text-primary-600"
      >
        {label}
      </label>
    </div>
  );
};

// export const RadioButton = ({
//   id,
//   label,
//   checked,
//   onChange,
//   primary,
//   disabled,
//   classes,
// }: {
//   id: string;
//   label: string;
//   checked?: boolean;
//   onChange?: OnChange;
//   primary?: boolean;
//   disabled?: boolean;
//   classes?: string | undefined;
// }) => {
//   const c = classNames(
//     classes,
//     "transition duration-300 font-bold py-2 px-0 focus:outline-none inline-flex items-center cursor-pointer",
//     {
//       "opacity-25": disabled,
//       "text-primary-600 bg-transparent": !primary,
//     }
//   );
//   return (
//     <div
//       className={c}
//     >
//       <input
//         type="radio"
//         id={id}
//         checked={checked}
//         className="w-5 h-5 mr-2 align-middle cursor-pointer"
//         onChange={onChange}
//       />
//       <label htmlFor={id} className="align-middle cursor-pointer select-none text-primary-600">
//         {label}
//       </label>
//     </div>
//   );
// };

export const TextInputWithButton = ({
  id,
  disabled,
  placeholder,
  buttonText,
  errors,
  buttonType = "button",
  inputValue,
  onChange,
  onButtonClick = () => {
    return false;
  },
}: {
  id: string;
  disabled?: boolean;
  placeholder?: string;
  buttonText?: string;
  errors?: Errors | undefined;
  buttonType?: "submit" | "button";
  inputValue?: string;
  onChange?: OnChange;
  onButtonClick?: () => void;
}) => {
  const inputClasses = classNames(
    "shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring w-8/12 rounded-r-none"
  );
  const buttonClasses = classNames(
    "transition duration-300 bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring rounded-l-none w-4/12"
  );

  const err: boolean = hasError(id, errors);

  return (
    <>
      <div className="flex w-full">
        <input
          id={id}
          name={id}
          type="text"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
          onChange={onChange}
        />
        <button
          disabled={disabled}
          aria-label={buttonText}
          className={buttonClasses}
          type={buttonType}
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      </div>
      {err && (
        <div className="w-full">
          <ValidationMessage message={(errors as any)[id]} />
        </div>
      )}
    </>
  );
};

export const RichTextInput = ({
  id,
  value,
  placeholder,
  onChange,
  errors,
  classes,
}: {
  id: string;
  value: string | undefined;
  placeholder?: string;
  onChange: OnChange;
  errors?: Errors | undefined;
  classes?: string | undefined;
}) => {
  const err: boolean = hasError(id, errors);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }],
      //["link", "image"],
      ["link"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "blockquote",
    "list",
    "bullet",
    "color",
    "link",
    // "image",
  ];

  const c = classNames(classes, {
    border: err,
    rounded: err,
    "p-1": err,
    "border-red-500": err,
  });

  return (
    <>
      <div className={c}>
        <ReactQuill
          defaultValue={value}
          value={value}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          onChange={onChange}
          bounds=".annotation-text"
          className="bg-white"
        />
      </div>
      {err && <ValidationMessage message={(errors as any)[id]} />}
    </>
  );
};

export const ValidationMessage = ({
  message,
  classes,
}: {
  message: string;
  classes?: string | undefined;
}) => {
  const c = classNames(classes, "pt-2 text-red-700 text-sm");
  return <p className={c}>{message}</p>;
};

export const NumberInput = ({
  id,
  value,
  min,
  max,
  step = 1,
  onChange,
  errors,
  classes,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange?: OnChange;
  errors?: Errors | undefined;
  classes?: string | undefined;
}) => {
  const err: boolean = hasError(id, errors);

  const c = classNames(
    classes,
    "appearance-none w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring border",
    {
      "border-red-500": err,
      "border-gray-400": !err,
    }
  );

  return (
    <>
      <input
        type="number"
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        className={c}
        onChange={onChange}
      />
      {err && <ValidationMessage message={(errors as any)[id]} />}
    </>
  );
};

export const RangeInput = ({
  id,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  errors,
  classes,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange?: OnChange;
  errors?: Errors | undefined;
  classes?: string | undefined;
}) => {
  const c = classNames(
    classes,
    "appearance-none w-full py-1 px-1 text-gray-900 leading-tight focus:outline-none focus:ring border border-gray-400"
  );

  const outputRef = useRef(null);

  return (
    <>
      <input
        type="range"
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        className={c}
        onChange={onChange}
        // @ts-ignore
        onInput={(e) => (outputRef.current!.value = e.currentTarget.value)}
      />
      <output ref={outputRef}>{value}</output>
    </>
  );
};
