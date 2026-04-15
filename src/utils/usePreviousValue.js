import { useRef, useEffect } from 'react';


export default function usePreviousValue(value) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}