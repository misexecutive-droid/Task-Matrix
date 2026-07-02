import React from "react";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?:       string;
  description?: string;
}

export const Form: React.FC<FormProps> = ({
  children,
  title,
  description,
  onSubmit,
  className = "",
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'w-full max-w-md p-6 bg-white',
        'border border-grey-200 rounded-card shadow-card',
        'flex flex-col gap-6',
        className,
      ].join(' ')}
      {...props}
    >
      {(title || description) && (
        <div className="flex flex-col gap-1">
          {title && (
            <h2 className="text-xl font-semibold font-display text-navy-900 title-rule">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-grey-600">{description}</p>
          )}
        </div>
      )}

      {children}
    </form>
  );
};
