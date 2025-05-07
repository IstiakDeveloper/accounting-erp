// app/resources/js/components/flash-message.tsx

import React, { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface FlashProps {
  flash: {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
  };
}

export default function FlashMessage({ flash }: FlashProps) {
  const [show, setShow] = useState(false);

  // Show the message when flash props change
  useEffect(() => {
    const hasMessage = flash.success || flash.error || flash.warning || flash.info;

    if (hasMessage) {
      setShow(true);

      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [flash]);

  // If no flash messages, don't render anything
  if (!flash.success && !flash.error && !flash.warning && !flash.info) {
    return null;
  }

  // Determine message type and styling
  let message = '';
  let bgColor = '';
  let textColor = '';
  let Icon = CheckCircle;

  if (flash.success) {
    message = flash.success;
    bgColor = 'bg-green-50';
    textColor = 'text-green-800';
    Icon = CheckCircle;
  } else if (flash.error) {
    message = flash.error;
    bgColor = 'bg-red-50';
    textColor = 'text-red-800';
    Icon = AlertCircle;
  } else if (flash.warning) {
    message = flash.warning;
    bgColor = 'bg-yellow-50';
    textColor = 'text-yellow-800';
    Icon = AlertCircle;
  } else if (flash.info) {
    message = flash.info;
    bgColor = 'bg-blue-50';
    textColor = 'text-blue-800';
    Icon = Info;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
      <Transition
        show={show}
        enter="transform transition duration-300"
        enterFrom="opacity-0 translate-x-4"
        enterTo="opacity-100 translate-x-0"
        leave="transform transition duration-200"
        leaveFrom="opacity-100 translate-x-0"
        leaveTo="opacity-0 translate-x-4"
      >
        <div className={`rounded-lg shadow-md p-4 ${bgColor}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className={`text-sm font-medium ${textColor}`}>{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                className={`inline-flex ${textColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                onClick={() => setShow(false)}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}
