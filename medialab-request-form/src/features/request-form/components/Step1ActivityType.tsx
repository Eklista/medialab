// src/features/request-form/components/Step1ActivityType.tsx
import { useState } from 'react';
import { useFormContext, ActivityType } from '@/contexts/FormContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';

// Esquema de validación para el paso 1
const step1Schema = z.object({
  activityType: z.enum(['unique', 'recurring', 'podcast', 'course'] as const),
});

type Step1FormValues = z.infer<typeof step1Schema>;

interface Step1ActivityTypeProps {
  onNext: () => void;
}

export function Step1ActivityType({ onNext }: Step1ActivityTypeProps) {
  const { formState, updateStep1 } = useFormContext();
  
  const form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      activityType: formState.step1.activityType || undefined,
    },
  });

  const handleSubmit = (data: Step1FormValues) => {
    updateStep1({ activityType: data.activityType });
    onNext();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Tipo de Actividad</h2>
        <p className="text-muted-foreground text-center">
          Selecciona el tipo de actividad para la cual necesitas servicios de MediaLab
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityTypeCard
          title="Actividad Única"
          description="Evento en una sola fecha y horario específico"
          value="unique"
          selected={form.watch('activityType') === 'unique'}
          onChange={() => form.setValue('activityType', 'unique')}
          icon={
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <ActivityTypeCard
          title="Actividad Recurrente"
          description="Eventos que se repiten en múltiples fechas"
          value="recurring"
          selected={form.watch('activityType') === 'recurring'}
          onChange={() => form.setValue('activityType', 'recurring')}
          icon={
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />

        <ActivityTypeCard
          title="Podcast"
          description="Producción de episodios para un podcast"
          value="podcast"
          selected={form.watch('activityType') === 'podcast'}
          onChange={() => form.setValue('activityType', 'podcast')}
          icon={
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
        />

        <ActivityTypeCard
          title="Cursos"
          description="Grabación y edición de clases para cursos"
          value="course"
          selected={form.watch('activityType') === 'course'}
          onChange={() => form.setValue('activityType', 'course')}
          icon={
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          }
        />
      </div>

      <div className="flex justify-center mt-8">
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg"
          disabled={!form.watch('activityType')}
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}

interface ActivityTypeCardProps {
  title: string;
  description: string;
  value: ActivityType;
  selected: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}

function ActivityTypeCard({
  title,
  description,
  value,
  selected,
  onChange,
  icon,
}: ActivityTypeCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected 
          ? 'border-2 border-primary shadow-md' 
          : 'border border-border hover:border-primary/30'
      }`}
      onClick={onChange}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RadioGroup className="hidden">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={value}
                  id={`activity-${value}`}
                  checked={selected}
                  className="text-purple-600"
                />
                <Label htmlFor={`activity-${value}`}>{title}</Label>
              </div>
            </RadioGroup>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <div className={`w-6 h-6 rounded-full border ${
            selected ? 'border-primary bg-primary' : 'border-border'
          } flex items-center justify-center`}>
            {selected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">{icon}</div>
      </CardContent>
    </Card>
  );
}