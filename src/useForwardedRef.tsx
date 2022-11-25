import { ForwardedRef, useEffect, useRef } from "react";

// based on https://medium.com/the-non-traditional-developer/how-to-use-the-forwarded-ref-in-react-1fb108f4e6af

export function useForwardedRef<T>(ref: ForwardedRef<T>) {
  const innerRef = useRef<T | null>(null);
  useEffect(() => {
    if (!ref) {
      innerRef.current = null;
      return;
    }
    if (typeof ref === "function") {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  });
  return innerRef;
}
