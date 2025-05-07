// app/resources/js/components/dropdown.tsx

import React, { useState, createContext, useContext, Fragment, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
}

const DropdownContext = createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
  toggleOpen: () => {},
});

interface DropdownProps {
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: '48' | '60' | '80';
  trigger: React.ReactElement;
}

export default function Dropdown({
  children,
  align = 'right',
  width = '48',
  trigger
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    setOpen((previousState) => !previousState);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', closeOnEscape);
    }

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  let alignmentClasses = '';

  if (align === 'left') {
    alignmentClasses = 'origin-top-left left-0';
  } else if (align === 'right') {
    alignmentClasses = 'origin-top-right right-0';
  }

  let widthClasses = '';

  if (width === '48') {
    widthClasses = 'w-48';
  } else if (width === '60') {
    widthClasses = 'w-60';
  } else if (width === '80') {
    widthClasses = 'w-80';
  }

  return (
    <DropdownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div className="relative" ref={dropdownRef}>
        {React.cloneElement(trigger, {
          onClick: toggleOpen,
        })}

        <Transition
          as={Fragment}
          show={open}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div
            className={`absolute z-50 mt-2 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white border border-slate-200 ${alignmentClasses} ${widthClasses}`}
          >
            {children}
          </div>
        </Transition>
      </div>
    </DropdownContext.Provider>
  );
}

// Export a context hook for components that need to access the dropdown state
export function useDropdown() {
  return useContext(DropdownContext);
}
