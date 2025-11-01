import React from 'react';
import { useInView } from '../../hooks/useInView';

/**
 * Wrapper component that animates children when scrolled into view
 * @param {string} animation - Animation type: 'fade-in', 'slide-up', 'slide-left', 'slide-right', 'scale-up', 'rotate-in'
 * @param {React.ReactNode} children - Child elements to animate
 * @param {string} className - Additional CSS classes
 * @param {number} delay - Animation delay in milliseconds
 */
const AnimatedSection = ({
  animation = 'slide-up',
  children,
  className = '',
  delay = 0,
  ...props
}) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`${animation} ${isInView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
