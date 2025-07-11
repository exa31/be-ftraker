import { startOfMonth, endOfMonth, sub, startOfDay, endOfDay, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';

export default function useSelectedView(periode: string) {
    const lastPeriode = (() => {
        let start, end;
        switch (periode) {
            case 'Day': {
                start = startOfDay(sub(new Date(), { days: 1 }));
                end = endOfDay(sub(new Date(), { days: 1 }));
                return { start, end };
            } case 'Month': {
                start = startOfMonth(sub(new Date(), { months: 1 }));
                end = endOfMonth(sub(new Date(), { months: 1 }));
                return { start, end };
            } case 'Year': {
                start = startOfYear(sub(new Date(), { years: 1 }));
                end = endOfYear(sub(new Date(), { years: 1 }));
                return { start, end };
            } case 'Week': {
                start = startOfWeek(sub(new Date(), { weeks: 1 }));
                end = endOfWeek(sub(new Date(), { weeks: 1 }));
                return { start, end };
            }
        }
        return { start, end };
    });
    const currentPeriode = (() => {
        let start, end;
        switch (periode) {
            case 'Day': {
                start = startOfDay(new Date());
                end = endOfDay(new Date());
                return { start, end };
            } case 'Month': {
                start = startOfMonth(new Date());
                end = endOfMonth(new Date());
                return { start, end };
            } case 'Year': {
                start = startOfYear(new Date());
                end = endOfYear(new Date());
                return { start, end };
            } case 'Week': {
                start = startOfWeek(new Date());
                end = endOfWeek(new Date());
                return { start, end };
            }
        }
        return { start, end };
    })
    return { lastPeriode, currentPeriode };
};