import Input from '../ui/Input';
import { normalizeScheduleTime } from '@/lib/scheduleTimeSlots';

type ScheduleTimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
  required?: boolean;
};

/** Saisie HH:mm avec précision à la minute (pas de pas 30 min). */
export default function ScheduleTimeInput({
  value,
  onChange,
  min,
  max,
  className,
  id,
  required,
}: ScheduleTimeInputProps) {
  const normalized = normalizeScheduleTime(value);
  const htmlValue = normalized ?? value;

  return (
    <Input
      type="time"
      step={60}
      id={id}
      required={required}
      value={htmlValue}
      min={min}
      max={max}
      onChange={(e) => {
        const next = normalizeScheduleTime(e.target.value);
        onChange(next ?? e.target.value);
      }}
      className={`py-2 text-sm tabular-nums ${className ?? ''}`}
    />
  );
}
