// src/features/dashboard/components/ui/index.ts
export { default as DashboardButton } from './DashboardButton';
export type { ButtonVariant, ButtonSize, DashboardButtonProps } from './DashboardButton';

export { default as DashboardTextInput } from './DashboardTextInput';
export type { DashboardTextInputProps } from './DashboardTextInput';

export { default as DashboardTextarea } from './DashboardTextArea';
export type { DashboardTextareaProps } from './DashboardTextArea';

export { default as DashboardSelect } from './DashboardSelect';
export type { DashboardSelectProps, SelectOption } from './DashboardSelect';

export { default as DashboardModal } from './DashboardModal';
export type { DashboardModalProps } from './DashboardModal';

export { default as DashboardDataTable } from './DashboardDataTable';
export type { DashboardDataTableProps, Column } from './DashboardDataTable';

export { default as DashboardCard } from './DashboardCard';
export type { DashboardCardProps } from './DashboardCard';

export { default as DashboardCheckbox, DashboardCheckboxGroup, DashboardCheckboxCard } from './DashboardCheckbox';
export type { DashboardCheckboxProps } from './DashboardCheckbox';

export { 
  default as DashboardPlaceholder,
  LoadingPlaceholder,
  NoPermissionPlaceholder,
  EmptyStatePlaceholder,
  ErrorPlaceholder,
  OfflinePlaceholder,
  MaintenancePlaceholder,
  usePlaceholderType
} from './DashboardPlaceholder';
export type { DashboardPlaceholderProps, PlaceholderType } from './DashboardPlaceholder';

export { default as Switch } from './Switch';

export { default as Badge } from './Badge';