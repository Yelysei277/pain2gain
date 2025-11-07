import { useCallback, useEffect, useMemo, useState } from 'react';

const TOPIC_OPTIONS = ['devtools', 'health', 'education', 'finance', 'business', 'other'] as const;

type Topic = (typeof TOPIC_OPTIONS)[number];

type SubscriptionResponse = {
  id: string;
  email: string | null;
  topics: string[] | null;
  is_active: boolean | null;
  unsubscribe_token: string | null;
};

type SubscriptionPayload = {
  subscription: SubscriptionResponse | null;
  error?: string;
};

function normalizeTopics(topics: string[] | null | undefined): Topic[] {
  if (!Array.isArray(topics)) {
    return [];
  }

  return topics.filter((topic): topic is Topic => TOPIC_OPTIONS.includes(topic as Topic));
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Simple but robust email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function useSubscription(initialEmail: string | null | undefined) {
  const [email, setEmailState] = useState(() => initialEmail ?? '');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [unsubscribeToken, setUnsubscribeToken] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingConfig, setMissingConfig] = useState(false);

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleApiError = useCallback(async (response: Response) => {
    let message = 'Unexpected error. Please try again.';

    try {
      const data = (await response.json()) as SubscriptionPayload;
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore parse errors
    }

    if (message.toLowerCase().includes('supabase environment variables')) {
      setMissingConfig(true);
    }

    setError(message);
  }, []);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    resetMessages();

    try {
      const response = await fetch('/api/subscriptions', { method: 'GET' });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to manage your subscription.');
        } else {
          await handleApiError(response);
        }
        return;
      }

      const payload = (await response.json()) as SubscriptionPayload;
      const subscription = payload.subscription;

      if (subscription) {
        setEmailState(subscription.email ?? initialEmail ?? '');
        setTopics(normalizeTopics(subscription.topics));
        setIsActive(Boolean(subscription.is_active));
        setUnsubscribeToken(subscription.unsubscribe_token ?? null);
      } else {
        setEmailState((value) => value || initialEmail || '');
        setTopics([]);
        setIsActive(false);
        setUnsubscribeToken(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscription.';
      if (message.toLowerCase().includes('supabase environment variables')) {
        setMissingConfig(true);
      }
      setError(message);
    } finally {
      setHasFetchedOnce(true);
      setLoading(false);
    }
  }, [handleApiError, initialEmail, resetMessages]);

  const hasSubscription = useMemo(() => {
    return Boolean(unsubscribeToken) || isActive;
  }, [isActive, unsubscribeToken]);

  const toggleTopic = useCallback((topic: Topic) => {
    setTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((item) => item !== topic);
      }
      return [...prev, topic];
    });
    resetMessages();
  }, [resetMessages]);

  const saveSubscription = useCallback(async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (topics.length === 0) {
      setError('Select at least one topic to subscribe.');
      return;
    }

    setSaving(true);
    resetMessages();

    try {
      const method = hasSubscription ? 'PUT' : 'POST';
      const payload = { email: email.trim(), topics };

      const response = await fetch('/api/subscriptions', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      const data = (await response.json()) as SubscriptionPayload;
      const subscription = data.subscription;

      if (subscription) {
        setEmailState(subscription.email ?? email);
        setTopics(normalizeTopics(subscription.topics));
        setIsActive(Boolean(subscription.is_active));
        setUnsubscribeToken(subscription.unsubscribe_token ?? null);
      }

      setSuccess('Subscription saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save subscription.';
      if (message.toLowerCase().includes('supabase environment variables')) {
        setMissingConfig(true);
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [email, handleApiError, hasSubscription, resetMessages, topics]);

  const unsubscribe = useCallback(async () => {
    if (!unsubscribeToken) {
      setError('Unable to unsubscribe: missing unsubscribe token.');
      return;
    }

    setUnsubscribing(true);
    resetMessages();

    try {
      const response = await fetch(`/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`);

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      setSuccess('You have successfully unsubscribed.');
      setIsActive(false);
      setTopics([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe.';
      if (message.toLowerCase().includes('supabase environment variables')) {
        setMissingConfig(true);
      }
      setError(message);
    } finally {
      setUnsubscribing(false);
    }
  }, [handleApiError, resetMessages, unsubscribeToken]);

  const setEmail = useCallback(
    (value: string) => {
      resetMessages();
      setEmailState(value);
    },
    [resetMessages]
  );

  useEffect(() => {
    fetchSubscription();
    // We want this effect to run only once on mount; dependencies handled inside callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    email,
    setEmail,
    topics,
    toggleTopic,
    isActive,
    unsubscribeToken,
    hasSubscription,
    loading,
    saving,
    unsubscribing,
    success,
    error,
    missingConfig,
    hasFetchedOnce,
    fetchSubscription,
    saveSubscription,
    unsubscribe,
    topicOptions: TOPIC_OPTIONS,
    isValidEmail,
  };
}

export type UseSubscriptionReturn = ReturnType<typeof useSubscription>;


