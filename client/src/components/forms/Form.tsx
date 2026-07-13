import React from "react";

interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  title?:       string;
  description?: string;
  onSubmit?:    React.FormEventHandler<HTMLFormElement>;
}

export const Form: React.FC<FormProps> = ({
  children,
  title,
  description,
  onSubmit,
  className = "",
  ...props
}) => {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'w-full max-w-md p-6 bg-white',
        ' rounded-card shadow-card',
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
