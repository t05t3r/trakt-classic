export type DateFieldProps = {
  label: string;
  type: 'date' | 'datetime-local';
  value: string;
  min?: string;
  max?: string;
  required?: boolean;
};
