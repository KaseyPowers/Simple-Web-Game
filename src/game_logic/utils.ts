// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEvent<T extends (...args: any[]) => void>() {
  const listeners: T[] = [];

  function onEvent(fn: T) {
    listeners.push(fn);
    return () => {
      listeners.filter((val) => val !== fn);
    };
  }

  function emitEvent(...args: Parameters<T>) {
    listeners.forEach((fn) => {
      fn(...args);
    });
  }

  return {
    onEvent,
    emitEvent,
  };
}
