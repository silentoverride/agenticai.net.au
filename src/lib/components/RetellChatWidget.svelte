<script lang="ts">
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';

  type Props = {
    publicKey: string;
    voiceAgentId: string;
    phoneNumber: string;
    agentVersion?: string;
    countries?: string;
    recaptchaKey?: string;
  };

  let {
    publicKey,
    voiceAgentId,
    phoneNumber,
    agentVersion = '',
    countries = 'AU',
    recaptchaKey = ''
  }: Props = $props();

  onMount(() => {
    if (!publicKey || !voiceAgentId || !phoneNumber) {
      if (dev) {
        console.warn(
          'Retell callback widget is disabled. Set PUBLIC_RETELL_PUBLIC_KEY, PUBLIC_RETELL_VOICE_AGENT_ID, and PUBLIC_RETELL_CALLBACK_PHONE_NUMBER.'
        );
      }

      return;
    }

    let cancelled = false;

    const scheduleLoad = () => {
      window.setTimeout(loadWidget, 0);
    };

    const startAfterPageLoad = () => {
      if (document.readyState === 'complete') {
        scheduleLoad();
        return;
      }

      window.addEventListener('load', scheduleLoad, { once: true });
    };

    const loadWidget = () => {
      if (cancelled || document.getElementById('retell-widget')) return;

      const canUseRecaptcha =
        recaptchaKey && !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (
        canUseRecaptcha &&
        !document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')
      ) {
        const recaptcha = document.createElement('script');
        recaptcha.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaKey)}`;
        recaptcha.async = true;
        recaptcha.defer = true;
        document.head.appendChild(recaptcha);
      }

      const script = document.createElement('script');
      script.id = 'retell-widget';
      script.type = 'module';
      script.src = 'https://dashboard.retellai.com/retell-widget.js';
      script.async = true;
      script.defer = true;
      script.dataset.publicKey = publicKey;
      script.dataset.agentId = voiceAgentId;
      script.dataset.widget = 'callback';
      script.dataset.phoneNumber = phoneNumber;
      script.dataset.title = 'Request an assessment call';
      script.dataset.logoUrl = '/logo.svg';
      script.dataset.color = '#0e9f8f';
      script.dataset.countries = countries;
      script.dataset.tc = `${window.location.origin}/terms`;

      if (agentVersion) {
        script.dataset.agentVersion = agentVersion;
      }

      if (canUseRecaptcha) {
        script.dataset.recaptchaKey = recaptchaKey;
      }

      document.head.appendChild(script);
    };

    startAfterPageLoad();

    return () => {
      cancelled = true;
      window.removeEventListener('load', scheduleLoad);
    };
  });
</script>
