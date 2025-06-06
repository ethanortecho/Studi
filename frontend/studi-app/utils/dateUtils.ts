// Date utilities for dashboard navigation

export function formatDateForDisplay(date: Date, type: 'daily' | 'weekly'): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (type === 'daily') {
    // Check if it's today
    if (isSameDay(date, today)) {
      return 'Today';
    }
    // Check if it's yesterday
    if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    }
    
    // Format as "Thursday, Jan 23" or "Thursday, Jan 23, 2024" if different year
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    
    if (date.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    
    return date.toLocaleDateString('en-US', options);
  } else {
    // Weekly format
    const currentWeekStart = getWeekStart(today);
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const weekStart = getWeekStart(date);
    
    // Check if it's this week
    if (isSameDay(weekStart, currentWeekStart)) {
      return 'This Week';
    }
    // Check if it's last week
    if (isSameDay(weekStart, lastWeekStart)) {
      return 'Last Week';
    }
    
    // Format as "Jan 13-19" or "Jan 13-19, 2024" if different year
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    
    let formattedRange = `${startMonth} ${startDay}-${endDay}`;
    
    if (weekStart.getFullYear() !== today.getFullYear()) {
      formattedRange += `, ${weekStart.getFullYear()}`;
    }
    
    return formattedRange;
  }
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  
  const weekStart = new Date(d);
  if (day === 0) {
    // Sunday: go back 6 days to get Monday
    weekStart.setDate(d.getDate() - 6);
  } else {
    // Monday to Saturday: go back (day - 1) days to get Monday
    weekStart.setDate(d.getDate() - (day - 1));
  }
  
  return weekStart;
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

export function navigateDate(currentDate: Date, direction: 'prev' | 'next', type: 'daily' | 'weekly'): Date {
  const newDate = new Date(currentDate);
  
  if (type === 'daily') {
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
  } else {
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
  }
  
  return newDate;
}

export function canNavigate(currentDate: Date, direction: 'prev' | 'next', type: 'daily' | 'weekly'): boolean {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  if (direction === 'next') {
    // Can't navigate beyond today/current week
    if (type === 'daily') {
      return currentDate < today;
    } else {
      const currentWeekStart = getWeekStart(today);
      const targetWeekStart = getWeekStart(currentDate);
      return targetWeekStart < currentWeekStart;
    }
  } else {
    // Can't navigate beyond 30 days ago
    if (type === 'daily') {
      return currentDate > thirtyDaysAgo;
    } else {
      const targetWeekStart = getWeekStart(currentDate);
      const limitWeekStart = getWeekStart(thirtyDaysAgo);
      return targetWeekStart > limitWeekStart;
    }
  }
}

export function formatDateForAPI(date: Date): string {
  // Keep the same calendar date but send it as a date string to server
  // This avoids timezone conversion issues while preserving the user's intended date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultDate(type: 'daily' | 'weekly'): Date {
  const today = new Date();
  if (type === 'weekly') {
    return getWeekStart(today);
  }
  return today;
} 