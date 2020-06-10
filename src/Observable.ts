/* eslint-disable prettier/prettier */
import { useEffect, useReducer } from 'react';
import { Observable } from 'rxjs';

interface ObservableState<T> {
    lastValue?: T;
    complete?: true;
    error?: any;
}
interface ObservableAction<T> {
    next?: T;
    complete?: true;
    error?: any;
}
function observableReducer<T>(state: ObservableState<T>, action: ObservableAction<T>): ObservableState<T> {
    if (action.hasOwnProperty('next')) {
        return {
            lastValue: action.next,
        };
    }
    if (action.complete) {
        return {
            lastValue: state.lastValue,
            complete: true,
        };
    }
    if (action.error !== undefined) {
        return {
            lastValue: state.lastValue,
            error: action.error,
        };
    }
    return state;
}
export function useObservable<T>(observable: Observable<T>): [T, ObservableState<T>] {
    const [state, dispatch] = useReducer(observableReducer, {});
    useEffect(() => {
        const subscription = observable.subscribe({
            next: (value) => dispatch({ next: value }),
            complete: () => dispatch({ complete: true }),
            error: (error) => {
                console.warn('Error from observable', error);
                dispatch({ error });
            },
        });
        return () => subscription.unsubscribe();
    }, [observable]);
    return [state.lastValue as any, state as any];
}
