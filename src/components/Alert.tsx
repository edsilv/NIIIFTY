import classNames from "classnames";

const Alert = ({ classes, children }: { classes?: any; children?: any; }) => {
  const c = classNames(
    "mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4",
    classes
  );
  return (
    <div className={c} role="alert">
      {children}
    </div>
  );
};

export default Alert;
