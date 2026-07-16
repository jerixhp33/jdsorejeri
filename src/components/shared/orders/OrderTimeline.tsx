'use client';

import { buildOrderTimeline, TimelineEvent } from '@/lib/orders';
import type { OrderStatus } from '@/types';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  currentStatus: OrderStatus;
  events?: any[];
  createdAt: string;
  updatedAt: string;
}

export function OrderTimeline({ currentStatus, events, createdAt, updatedAt }: Props) {
  const timeline = buildOrderTimeline(currentStatus, events, createdAt, updatedAt);

  return (
    <div className="space-y-6">
      <div className="relative pl-8 border-l border-zinc-800 space-y-8">
        {timeline.map((step, index) => {
          const IconComponent = (Icons as any)[step.icon] || Icons.Circle;
          
          return (
            <div key={step.id} className="relative group">
              {/* Timeline Connector Line */}
              {index !== timeline.length - 1 && (
                <div className={`absolute left-[-2.05rem] top-8 bottom-[-2rem] w-[2px] ${
                  step.isCompleted ? 'bg-luxe-accent/50' : 'bg-zinc-800'
                }`} />
              )}

              {/* Status Icon */}
              <div 
                className={`absolute left-[-2.5rem] top-1 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.isCurrent 
                    ? 'border-luxe-accent bg-zinc-900 shadow-[0_0_15px_rgba(200,169,110,0.3)] ring-2 ring-luxe-accent/20 ring-offset-2 ring-offset-zinc-950' 
                    : step.isCompleted
                      ? 'border-luxe-accent bg-luxe-accent/20'
                      : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${
                  step.isCurrent || step.isCompleted ? step.color : 'text-zinc-500'
                }`} />
              </div>

              {/* Status Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    step.isCurrent 
                      ? 'text-foreground' 
                      : step.isCompleted ? 'text-zinc-200' : 'text-zinc-500'
                  }`}>
                    {step.title}
                  </h4>
                  {step.date && (
                    <time className="text-xs text-zinc-500">
                      {format(new Date(step.date), 'MMM d, h:mm a')}
                    </time>
                  )}
                </div>
                {step.description && (
                  <p className={`text-sm ${
                    step.isCurrent ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
