import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { MonthSelector } from '@/components/MonthSelector';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

describe('MonthSelector', () => {
  it('renders the formatted month and triggers callbacks', () => {
    const onNext = jest.fn();
    const onPrev = jest.fn();
    const date = new Date(2026, 0, 15);

    const { getByText, getByTestId } = render(
      <PaperProvider>
        <MonthSelector date={date} onNext={onNext} onPrev={onPrev} />
      </PaperProvider>
    );

    getByText(format(date, 'MMMM yyyy', { locale: he }));

    fireEvent.press(getByTestId('month-selector-next'));
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('month-selector-prev'));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });
});

