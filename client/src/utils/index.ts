import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency (Indian Rupees)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with K/M suffix
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
  }
  return num.toString();
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

// Format time
export function formatTime(time: string): string {
  // Assuming time is in HH:mm format
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Debounce function
export function debounce<T extends (...args: string[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Calculate discount
export function calculateDiscount(amount: number, percentage: number): number {
  return Math.round(amount * (percentage / 100));
}

// Get consultation type display name
export function getConsultationTypeName(type: string): string {
  const names: Record<string, string> = {
    chat: 'Chat',
    voice_call: 'Phone Call',
    video_call: 'Video Call',
  };
  return names[type] || type;
}

// Get consultation icon
export function getConsultationIcon(type: string): string {
  const icons: Record<string, string> = {
    chat: '💬',
    voice_call: '📞',
    video_call: '💻',
  };
  return icons[type] || '📱';
}

// Generate time slots
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 21;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    slots.push(time);
  }
  
  return slots;
}

// Generate next 7 days
export function generateNextDays(days: number = 7): Array<{ day: string; date: number; fullDate: Date }> {
  const result: Array<{ day: string; date: number; fullDate: Date }> = [];
  const today = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    result.push({
      day: dayNames[date.getDay()],
      date: date.getDate(),
      fullDate: date,
    });
  }
  
  return result;
}

// Check if element is in viewport
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
