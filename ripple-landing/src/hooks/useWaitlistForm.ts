// Manages waitlist email input, validation, and success state without a backend.

'use client';

import { useState } from 'react';
import { validateEmail } from '@/lib/validateEmail';

const WAITLIST_ERROR_MESSAGE = 'Enter a valid email address.';

type WaitlistFormState = {
  email: string;
  errorMessage: string;
  isSubmitted: boolean;
  isSubmitting: boolean;
};

type WaitlistFormActions = {
  setEmail: (email: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

type UseWaitlistFormResult = WaitlistFormState & WaitlistFormActions;

/**
 * Handles client-side waitlist form state until a real API endpoint exists.
 */
export function useWaitlistForm(): UseWaitlistFormResult {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (isSubmitted || isSubmitting) {
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage(WAITLIST_ERROR_MESSAGE);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      setIsSubmitted(true);
    } catch (error) {
      console.error('Waitlist form error:', error);
      setErrorMessage(WAITLIST_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    errorMessage,
    isSubmitted,
    isSubmitting,
    setEmail,
    handleSubmit,
  };
}
