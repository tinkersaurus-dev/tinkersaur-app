import React, { createContext, useContext } from 'react';
import {
  useForm as useHookForm,
  FormProvider,
  useFormContext,
  Controller,
} from 'react-hook-form';
import type {
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  ControllerRenderProps,
  RegisterOptions,
  DefaultValues,
} from 'react-hook-form';

// Form Context
interface FormContextValue {
  layout?: 'vertical' | 'horizontal' | 'inline';
}

const FormContext = createContext<FormContextValue>({});

// Main Form Component
export interface FormProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  onSubmit?: SubmitHandler<T>;
  layout?: 'vertical' | 'horizontal' | 'inline';
  children: React.ReactNode;
  className?: string;
}

export function Form<T extends FieldValues = FieldValues>({
  form,
  onSubmit,
  layout = 'vertical',
  children,
  className = '',
}: FormProps<T>) {
  const handleSubmit = onSubmit ? form.handleSubmit(onSubmit) : undefined;

  return (
    <FormProvider {...form}>
      <FormContext.Provider value={{ layout }}>
        <form onSubmit={handleSubmit} className={className}>
          {children}
        </form>
      </FormContext.Provider>
    </FormProvider>
  );
}

// Form Item Component
export interface FormItemProps {
  name: string;
  label?: string;
  required?: boolean;
  help?: string;
  children: (props: {
    field: ControllerRenderProps<FieldValues>;
    error?: string;
  }) => React.ReactNode;
  rules?: {
    required?: boolean | string;
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    validate?: (value: unknown) => boolean | string;
  };
  className?: string;
}

function FormItem({
  name,
  label,
  required = false,
  help,
  children,
  rules = {},
  className = '',
}: FormItemProps) {
  const { control } = useFormContext();
  const { layout } = useContext(FormContext);

  // Transform rules to react-hook-form format
  const formRules: RegisterOptions = {};

  if (rules.required || required) {
    formRules.required = typeof rules.required === 'string'
      ? rules.required
      : `${label || name} is required`;
  }

  if (rules.pattern) formRules.pattern = rules.pattern;
  if (rules.min) formRules.min = rules.min;
  if (rules.max) formRules.max = rules.max;
  if (rules.minLength) formRules.minLength = rules.minLength;
  if (rules.maxLength) formRules.maxLength = rules.maxLength;
  if (rules.validate) formRules.validate = rules.validate;

  const containerClassName = `
    ${layout === 'vertical' ? 'flex flex-col gap-1' : ''}
    ${layout === 'horizontal' ? 'flex items-start gap-4' : ''}
    ${layout === 'inline' ? 'inline-flex items-center gap-2' : ''}
    ${className}
  `.trim();

  const labelClassName = `
    text-[var(--text)]
    text-base
    font-medium
    ${layout === 'horizontal' ? 'w-32 pt-2' : ''}
  `.trim();

  return (
    <Controller
      name={name}
      control={control}
      rules={formRules}
      render={({ field, fieldState: { error } }) => (
        <div className={containerClassName}>
          {label && (
            <label htmlFor={name} className={labelClassName}>
              {label}
              {required && <span className="text-[var(--danger)] ml-1">*</span>}
            </label>
          )}
          <div className="flex-1">
            {children({ field, error: error?.message })}
            {error && (
              <div className="text-[var(--danger)] text-sm mt-1">
                {error.message}
              </div>
            )}
            {!error && help && (
              <div className="text-[var(--text-muted)] text-sm mt-1">
                {help}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}

// Hook wrapper for easier usage
export function useForm<T extends FieldValues = FieldValues>(
  defaultValues?: DefaultValues<T>
) {
  return useHookForm<T>({
    defaultValues,
    mode: 'onChange',
  });
}

// Attach FormItem to Form
Form.Item = FormItem;

// Export useFormContext for advanced usage
export { useFormContext };
